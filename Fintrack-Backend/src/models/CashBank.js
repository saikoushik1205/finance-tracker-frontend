const mongoose = require("mongoose");

const balanceAccountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const cashBankSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    cash: {
      type: Number,
      default: 0,
      min: 0,
    },
    bank: {
      type: Number,
      default: 0,
      min: 0,
    },
    amazonPayAccounts: {
      type: [balanceAccountSchema],
      default: [],
    },
    bankAccounts: {
      type: [balanceAccountSchema],
      default: [],
    },
    tideAccounts: {
      type: [balanceAccountSchema],
      default: [],
    },
    history: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["cash", "bank", "amazonPay", "bankAccount", "tide"],
        },
        previousAmount: Number,
        newAmount: Number,
        change: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CashBank", cashBankSchema);
