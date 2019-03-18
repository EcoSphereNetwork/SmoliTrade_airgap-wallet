import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'
import { TezosKtProtocol, AirGapMarketWallet } from 'airgap-coin-lib'
import { BakerInfo, DelegationInfo } from 'airgap-coin-lib/dist/protocols/tezos/kt/TezosKtProtocol'
import BigNumber from 'bignumber.js'
import { OperationsProvider } from '../../providers/operations/operations'
import { handleErrorSentry, ErrorCategory } from '../../providers/sentry-error-handler/sentry-error-handler'
import { RemoteConfigProvider, BakerConfig } from '../../providers/remote-config/remote-config'

@Component({
  selector: 'page-delegation-baker-detail',
  templateUrl: 'delegation-baker-detail.html'
})
export class DelegationBakerDetailPage {
  public bakerConfig: BakerConfig

  public wallet: AirGapMarketWallet

  public bakerInfo: BakerInfo
  public delegationRewards: DelegationInfo[]

  public avgRoIPerCyclePercentage: BigNumber
  public avgRoIPerCycle: BigNumber

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public operationsProvider: OperationsProvider,
    public remoteConfigProvider: RemoteConfigProvider
  ) {
    this.wallet = this.navParams.get('wallet')
  }

  async ionViewDidLoad() {
    // get baker 0, always airgap for now
    this.bakerConfig = (await this.remoteConfigProvider.tezosBakers())[0]

    const kt = new TezosKtProtocol()
    this.bakerInfo = await kt.bakerInfo(this.bakerConfig.address)
    this.delegationRewards = await kt.delegationRewards(this.bakerConfig.address)

    this.avgRoIPerCyclePercentage = this.delegationRewards
      .map(delegationInfo => {
        return delegationInfo.totalRewards.plus(delegationInfo.totalFees).div(delegationInfo.stakingBalance)
      })
      .reduce((avg, value) => {
        return avg.plus(value)
      })
      .div(this.delegationRewards.length)

    this.avgRoIPerCycle = this.avgRoIPerCyclePercentage.multipliedBy(this.wallet.currentBalance)
  }

  async delegate() {
    const pageOptions = await this.operationsProvider.prepareDelegate(this.wallet, this.bakerConfig.address)
    this.navCtrl.push(pageOptions.page, pageOptions.params).catch(handleErrorSentry(ErrorCategory.NAVIGATION))
  }
}