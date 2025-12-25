

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './entities/purchase.entity';

@Injectable()
export class PurchasesService {
    constructor(
        @InjectRepository(Purchase)
        private purchasesRepository: Repository<Purchase>,
    ) {}

    async findUserPurchaseHistory(userId: number): Promise<Purchase[]> {


        return this.purchasesRepository.find({
            where: { user_id: userId },
            relations: ['item'],            order: { purchased_at: 'DESC' },        });
    }
}