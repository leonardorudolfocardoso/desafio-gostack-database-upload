import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    // TODO DONE

    // gets transactions
    const transactions = await this.find();

    // check if there is transactions
    if (transactions.length === 0) {
      // if not, return zero balance
      return ({
        income: 0,
        outcome: 0,
        total: 0,
      });
    }

    // filters incomes and outcomes
    const incomes = transactions.map(transaction => transaction.type === "income" ? Number(transaction.value) : 0);
    const outcomes = transactions.map(transaction => transaction.type === "outcome" ? Number(transaction.value) : 0);

    // creates and applies reducer to sum
    const sumReducer = (sum: number, current: number) => sum + current;
    const income = incomes.reduce(sumReducer);
    const outcome = outcomes.reduce(sumReducer);
    const total = income - outcome;

    return ({
      income,
      outcome,
      total,
    });
  }
}

export default TransactionsRepository;
