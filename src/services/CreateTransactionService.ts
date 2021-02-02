import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    // TODO
    // get repositories
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    // if type is outcome, verify balance
    if (type==='outcome') {
      const { total } = await transactionsRepository.getBalance();
      // if outcome value is greater than total, transaction is denied
      if (value > total) {
        throw new AppError('Outcome greater than balance.', 400);
      }
    }

    // verify if category exists
    let transactionCategory = await categoriesRepository.findOne({
      where: { title: category }
    });

    // if it does not, create it
    if (!transactionCategory) {
      transactionCategory = categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(transactionCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
