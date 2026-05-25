const CashBank = require("../models/CashBank");

const normalizeAccounts = (accounts = []) =>
  accounts
    .filter((account) => account && String(account.name || "").trim())
    .map((account) => ({
      name: String(account.name).trim(),
      balance: Number(account.balance) || 0,
    }));

const getAccountTotal = (accounts = []) =>
  accounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0);

const buildResponseData = (cashBank) => {
  const amazonPayAccounts = cashBank.amazonPayAccounts || [];
  const bankAccounts = cashBank.bankAccounts || [];
  const tideAccounts = cashBank.tideAccounts || [];
  const amazonPay = getAccountTotal(amazonPayAccounts);
  const bank = getAccountTotal(bankAccounts);
  const tide = getAccountTotal(tideAccounts);
  const total = amazonPay + bank + tide;

  return {
    cash: amazonPay + tide,
    bank,
    amazonPay,
    tide,
    total,
    amazonPayAccounts,
    bankAccounts,
    tideAccounts,
    updatedAt: cashBank.updatedAt,
  };
};

/**
 * Get cash and bank balances
 */
exports.getCashBank = async (req, res) => {
  try {
    const userId = req.user._id;

    let cashBank = await CashBank.findOne({ userId });

    if (!cashBank) {
      cashBank = await CashBank.create({
        userId,
        cash: 0,
        bank: 0,
        amazonPayAccounts: [],
        bankAccounts: [],
        tideAccounts: [],
      });
    }

    res.json({
      success: true,
      data: buildResponseData(cashBank),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cash/bank data",
      error: error.message,
    });
  }
};

/**
 * Update cash and bank balances
 */
exports.updateCashBank = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cash, bank, amazonPayAccounts, bankAccounts, tideAccounts } =
      req.body;

    if ((cash !== undefined && cash < 0) || (bank !== undefined && bank < 0)) {
      return res.status(400).json({
        success: false,
        message: "Amounts must be 0 or greater",
      });
    }

    let cashBank = await CashBank.findOne({ userId });

    if (!cashBank) {
      cashBank = await CashBank.create({
        userId,
        cash: cash !== undefined ? cash : 0,
        bank: bank !== undefined ? bank : 0,
        amazonPayAccounts: Array.isArray(amazonPayAccounts)
          ? normalizeAccounts(amazonPayAccounts)
          : [],
        bankAccounts: Array.isArray(bankAccounts)
          ? normalizeAccounts(bankAccounts)
          : bank !== undefined
          ? [{ name: "Bank Account", balance: bank }]
          : [],
        tideAccounts: Array.isArray(tideAccounts)
          ? normalizeAccounts(tideAccounts)
          : [],
      });
    } else {
      if (cash !== undefined) cashBank.cash = cash;
      if (bank !== undefined) cashBank.bank = bank;
      if (Array.isArray(amazonPayAccounts)) {
        cashBank.amazonPayAccounts = normalizeAccounts(amazonPayAccounts);
      }
      if (Array.isArray(bankAccounts)) {
        cashBank.bankAccounts = normalizeAccounts(bankAccounts);
        cashBank.bank = getAccountTotal(cashBank.bankAccounts);
      }
      if (Array.isArray(tideAccounts)) {
        cashBank.tideAccounts = normalizeAccounts(tideAccounts);
      }
      await cashBank.save();
    }

    res.json({
      success: true,
      message: "Balances updated successfully",
      data: buildResponseData(cashBank),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update balances",
      error: error.message,
    });
  }
};
