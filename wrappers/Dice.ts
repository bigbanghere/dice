import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
export const Op = { Deploy: 0, Bet: 1, Setup: 2, TopUp: 3, Withdraw: 4, };
export const Result = { ValueError: 0, Loss: 1, };
export type DiceConfig = { owner: Address, max_bet_profit: bigint, house_edge_x10: bigint, };
export function diceConfigToCell(config: DiceConfig): Cell {
    return beginCell()
    .storeAddress(config.owner)
    .storeCoins(config.max_bet_profit)
    .storeUint(config.house_edge_x10, 16)
    .endCell(); }
export class Dice implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}
    static createFromAddress(address: Address) { return new Dice(address); }
    static createFromConfig(config: DiceConfig, code: Cell, workchain = 0) {
        const data = diceConfigToCell(config);
        const init = { code, data };
        return new Dice(contractAddress(workchain, init), init); }
    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, { value, sendMode: SendMode.PAY_GAS_SEPARATELY, body: beginCell().storeUint(Op.Deploy, 32).endCell(), }); }
    async sendBet(provider: ContractProvider, via: Sender, value: bigint, bet_odds: bigint, hi: bigint) {
        await provider.internal(via, { value, sendMode: SendMode.PAY_GAS_SEPARATELY, body: beginCell().storeUint(Op.Bet, 32).storeUint(0, 64)
            .storeUint(bet_odds, 16).storeUint(hi, 2).endCell(),}); }
    async sendSetup(provider: ContractProvider, via: Sender, value: bigint, owner: Address, max_bet_profit: bigint, house_edge_x10: bigint, ) {
        await provider.internal(via, { value, sendMode: SendMode.PAY_GAS_SEPARATELY, body: beginCell().storeUint(Op.Setup, 32).storeUint(0, 64)
            .storeAddress(owner).storeCoins(max_bet_profit).storeUint(house_edge_x10, 16).endCell(),}); }
    async sendTopUp(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, { value, sendMode: SendMode.PAY_GAS_SEPARATELY, body: beginCell().storeUint(Op.TopUp, 32).endCell(),}); }
    async sendWithdraw(provider: ContractProvider, via: Sender, value: bigint, w_amount: bigint) {
        await provider.internal(via, { value, sendMode: SendMode.PAY_GAS_SEPARATELY, body: beginCell().storeUint(Op.Withdraw, 32).storeUint(0, 64).storeCoins(w_amount).endCell(),}); }
    async getData(provider: ContractProvider) {
        const result = await provider.get('get_smc_data', []);
        return result.stack.readCell(); } }
