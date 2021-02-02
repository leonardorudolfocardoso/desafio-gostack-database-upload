import AppError from '../errors/AppError';

import { response } from 'express';
import { getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    // TODO DONE

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactionToDelete = await transactionsRepository.findOne(id);

    if (!transactionToDelete) {
      throw new AppError('Transaction not found', 400);
    }

    await transactionsRepository.remove(transactionToDelete);
  }
}

export default DeleteTransactionService;
