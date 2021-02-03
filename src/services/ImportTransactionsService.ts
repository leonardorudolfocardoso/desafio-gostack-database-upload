import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    // TODO DONE

    // get repositories
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    // prepare read stream
    const contactsReadStream = fs.createReadStream(filePath);

    // create parse with options
    const parsers = csvParse({
      from_line: 2,
    });

    // READ ABOUT
    const parseCSV = contactsReadStream.pipe(parsers);

    // instantiate arrays variables
    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    // bulk insert strategy
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string)=> cell.trim());

      if ( !title || !type || !value ) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    // make sure the file is totally read
    await new Promise(resolve => parseCSV.on('end', resolve));

    // find existent categories inside database
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      }
    });

    // catch existent categories titles
    const existentCategoriesTitles = existentCategories.map(category => category.title);

    // filter which categories to create
    const categoriesToCreate = categories
      .filter(category => !existentCategoriesTitles.includes(category))
        .filter((value, index, self) => self.indexOf(value) === index);

    // create new categories, save it and concat to existent ones
    const newCategories = categoriesRepository.create(
      categoriesToCreate.map(title => ({ title }))
    );
    await categoriesRepository.save(newCategories);
    const finalCategories = [...existentCategories, ...newCategories];

    // creating new transactions and save it
    const newTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(category => category.title === transaction.category),
      }))
    );
    await transactionsRepository.save(newTransactions);

    // delete file from tmp
    fs.promises.unlink(filePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
