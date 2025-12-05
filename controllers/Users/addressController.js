// controllers/user/addressController.js
const Users = require("../../models/User");

// helper to normalize strings
const normalize = (str) => (str || "").trim().toLowerCase();

// ✅ GET /v1/users/addresses – current user addresses list
exports.getMyAddresses = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await Users.findById(userId).select("addresses");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user.addresses || []);
  } catch (err) {
    console.error("getMyAddresses error:", err);
    return res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

// ✅ POST /v1/users/addresses – add new address
exports.addAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      name,
      phone,
      pincode,
      addressLine1,
      addressLine2,
      city,
      state,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    if (!name || !phone || !pincode || !addressLine1 || !city || !state) {
      return res.status(400).json({
        message:
          "Name, phone, pincode, addressLine1, city and state are required",
      });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    // 🔹 DUPLICATE CHECK
    const alreadyExists = user.addresses.some((a) =>
      normalize(a.addressLine1) === normalize(addressLine1) &&
      normalize(a.addressLine2) === normalize(addressLine2) &&
      normalize(a.city) === normalize(city) &&
      normalize(a.state) === normalize(state) &&
      normalize(a.pincode) === normalize(pincode)
    );

    if (alreadyExists) {
      return res
        .status(400)
        .json({ message: "This address already exists in your account." });
    }

    const newAddress = {
      name,
      phone,
      pincode,
      addressLine1,
      addressLine2,
      city,
      state,
      landmark,
      addressType: addressType || "home",
      isDefault: false,
    };

    // pehla address → default
    if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    } else if (isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    return res.status(201).json(user.addresses);
  } catch (err) {
    console.error("addAddress error:", err);
    return res.status(500).json({ message: "Failed to add address" });
  }
};

// ✅ PUT /v1/users/addresses/:addressId – update existing
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const addressId = req.params.addressId;

    const {
      name,
      phone,
      pincode,
      addressLine1,
      addressLine2,
      city,
      state,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (name !== undefined) address.name = name;
    if (phone !== undefined) address.phone = phone;
    if (pincode !== undefined) address.pincode = pincode;
    if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (landmark !== undefined) address.landmark = landmark;
    if (addressType !== undefined) address.addressType = addressType;

    if (isDefault === true) {
      user.addresses.forEach((a) => {
        a.isDefault = a._id.toString() === addressId;
      });
    }

    await user.save();

    return res.json(user.addresses);
  } catch (err) {
    console.error("updateAddress error:", err);
    return res.status(500).json({ message: "Failed to update address" });
  }
};

// ✅ DELETE /v1/users/addresses/:addressId – remove address
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const addressId = req.params.addressId;

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!Array.isArray(user.addresses) || user.addresses.length === 0) {
      return res.status(404).json({ message: "No addresses found" });
    }

    // find index instead of using subdoc.remove()
    const index = user.addresses.findIndex(
      (a) => a._id.toString() === addressId
    );

    if (index === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    const wasDefault = user.addresses[index].isDefault === true;

    // remove from array
    user.addresses.splice(index, 1);

    // if it was default, make first one default (if any)
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    // send updated addresses back
    return res.json(user.addresses);
  } catch (err) {
    console.error("deleteAddress error:", err);
    return res.status(500).json({ message: "Failed to delete address" });
  }
};

// ✅ PATCH /v1/users/addresses/:addressId/default – set default
exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const addressId = req.params.addressId;

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === addressId;
    });

    await user.save();

    return res.json(user.addresses);
  } catch (err) {
    console.error("setDefaultAddress error:", err);
    return res.status(500).json({ message: "Failed to set default address" });
  }
};
