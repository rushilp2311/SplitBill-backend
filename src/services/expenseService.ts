const calculateSplit = (paidBy, members, amount) => {
  const splittedAmount = +Number(amount / members.length).toFixed(2);
  const membersBalance = members.map((member) => {
    if (member._id.toString() === paidBy.toString()) {
      return {
        memberId: member._id,
        name: member.name,
        balance: Number(amount - splittedAmount).toFixed(2),
      };
    } else {
      return {
        memberId: member._id,
        name: member.name,
        balance: `-${Number(splittedAmount).toFixed(2)}`,
      };
    }
  });
  return membersBalance;
};

const updateMemberBalances = async (expenses, members) => {
  let updatedMemberBalances;
  if (expenses) {
    updatedMemberBalances = expenses.map(({ _id, paidBy, amount }: any) => {
      return {
        expenseId: _id,
        membersBalance: calculateSplit(paidBy, members, amount),
      };
    });
  }

  return Promise.all(updatedMemberBalances);
};

export { calculateSplit, updateMemberBalances };
