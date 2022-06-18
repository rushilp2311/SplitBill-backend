import Joi from "joi";
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 100,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  membersBalance: {
    type: Array,
    required: true,
    default: [],
  },
  settledMembers: {
    type: Array,
    default: [],
  },

  isSettled: {
    type: Boolean,
    default: false,
  },
});

const Expense = mongoose.model("Expense", expenseSchema);

const validateExpense = (expense: any) => {
  const schema = {
    description: Joi.string().min(1).max(100).required(),
    amount: Joi.number().min(0).required(),
    date: Joi.date().required(),
    group: Joi.required(),
    paidBy: Joi.required(),
  };
  return Joi.object(schema).validate(expense);
};

export default Expense;
export { validateExpense };
