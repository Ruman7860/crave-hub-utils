import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  STORAGE_PROVIDER,
  STORAGE_PROVIDER_STRATEGIES,
} from '../constants/storage.constants';
import { StorageProviderStrategy } from '../interfaces/storage-provider.interface';

@Injectable()
export class StorageProviderFactory {
  private readonly strategiesMap: Map<string, StorageProviderStrategy>;

  constructor(
    @Inject(STORAGE_PROVIDER_STRATEGIES)
    strategies: StorageProviderStrategy[],
    @Inject(STORAGE_PROVIDER)
    private readonly defaultProvider: string,
  ) {
    this.strategiesMap = new Map(
      strategies.map((strategy) => [strategy.providerName, strategy]),
    );
  }

  getProvider(provider?: string): StorageProviderStrategy {
    const resolvedProvider = (provider ?? this.defaultProvider).toLowerCase();
    const strategy = this.strategiesMap.get(resolvedProvider);

    if (!strategy) {
      throw new BadRequestException(
        `Storage provider "${resolvedProvider}" is not supported`,
      );
    }

    return strategy;
  }
}
