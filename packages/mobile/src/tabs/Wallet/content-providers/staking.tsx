import { ContentProviderPrototype } from './utils/prototype';
import { CellItemToRender, FiatRate } from './utils/types';
import { formatter } from '@tonkeeper/shared/formatter';
import { Providers } from './providers';
import {
  AccountStakingInfo,
  PoolImplementationType,
  PoolInfo,
} from '@tonkeeper/core/src/TonAPI';
import { TonPriceDependency } from './dependencies/tonPrice';
import { JettonBalancesDependency } from './dependencies/jettons';
import { Address } from '@tonkeeper/shared/Address';
import { StakingDependency } from './dependencies/staking';
import BigNumber from 'bignumber.js';
import { StakedTonIcon } from '$uikit/StakedTonIcon';
import { StakingMessage } from '../components/StakingMessage';
import { openStakingPoolDetails } from '$navigation';
import { t } from '@tonkeeper/shared/i18n';

export class StakingContentProvider extends ContentProviderPrototype<{
  tonPrice: TonPriceDependency;
  jettonBalances: JettonBalancesDependency;
  staking: StakingDependency;
}> {
  name = Providers.Staking;
  renderPriority = 0;

  constructor(
    private isEditableMode: boolean,
    tonPrice: TonPriceDependency,
    jettonBalances: JettonBalancesDependency,
    staking: StakingDependency,
  ) {
    super({
      tonPrice,
      jettonBalances,
      staking,
    });
  }

  private getRate(pool: PoolInfo, info: AccountStakingInfo) {
    const jettonBalance = this.deps.jettonBalances.state.jettonBalances.find(
      (balance) =>
        Address.parse(balance.jettonAddress).toRaw() === pool.liquid_jetton_master,
    );

    let fiatRate: FiatRate | undefined;

    if (jettonBalance) {
      fiatRate = this.deps.jettonBalances.getJettonRate(
        jettonBalance.jettonAddress,
        jettonBalance.balance,
        this.deps.tonPrice.state.currency,
      );
    } else {
      fiatRate = this.deps.tonPrice.getFiatRate(
        formatter.fromNano(info.amount).toString(),
      );
    }

    if (!info) {
      return fiatRate;
    }

    if (fiatRate && info.pending_deposit) {
      fiatRate.total.raw = new BigNumber(fiatRate.total.raw)
        .plus(this.deps.tonPrice.getRawTotal(formatter.fromNano(info.pending_deposit)))
        .toString();
    }

    if (fiatRate && info.ready_withdraw) {
      fiatRate.total.raw = new BigNumber(fiatRate.total.raw)
        .plus(this.deps.tonPrice.getRawTotal(formatter.fromNano(info.ready_withdraw)))
        .toString();
    }

    /**
     * We should count pending withdraw balance for liquid staking.
     * But in other cases withdraw is counted in the total balance ¯\_(ツ)_/¯
     */
    if (
      fiatRate &&
      pool.implementation === PoolImplementationType.LiquidTF &&
      info.pending_withdraw
    ) {
      fiatRate.total.raw = new BigNumber(fiatRate.total.raw)
        .plus(this.deps.tonPrice.getRawTotal(formatter.fromNano(info.pending_withdraw)))
        .toString();
      fiatRate.totalTon.raw = new BigNumber(fiatRate.totalTon.raw)
        .plus(formatter.fromNano(info.pending_withdraw))
        .toString();
    }

    return fiatRate;
  }

  get itemsArray() {
    return this.deps.staking.state.filter((item) => {
      const info = item.info;
      if (info) {
        return true;
      }

      if ([PoolImplementationType.LiquidTF].includes(item.pool.implementation)) {
        const stakingJetton = this.deps.jettonBalances.state.jettonBalances.find(
          (jettonBalance) =>
            Address.parse(jettonBalance.jettonAddress).toRaw() ===
            item.pool.liquid_jetton_master,
        );
        return stakingJetton && stakingJetton.balance !== '0';
      }
    });
  }

  makeCellItemFromData(data: {
    info: AccountStakingInfo;
    pool: PoolInfo;
  }): CellItemToRender {
    const fiatRate = this.getRate(data.pool, data.info);

    return {
      key: data.pool.address,
      onPress: () => openStakingPoolDetails(data.pool.address),
      renderPriority: this.renderPriority,
      fiatRate: this.getRate(data.pool, data.info),
      title: this.isEditableMode ? data.pool.name : t('staking.staked'),
      renderIcon: () => <StakedTonIcon size={'small'} pool={data.pool} />,
      renderBottomContent: () => (
        <StakingMessage pool={data.pool} poolStakingInfo={data.info} />
      ),
      subtitle: this.isEditableMode
        ? formatter.format(fiatRate?.totalTon.raw, { currency: 'TON' })
        : data.pool.name,
      value: formatter.format(fiatRate?.totalTon.raw),
    };
  }
}
