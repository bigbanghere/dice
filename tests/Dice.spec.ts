import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Dice, Op, Result } from '../wrappers/Dice';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Dice', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let owner: SandboxContract<TreasuryContract>;
    let player: SandboxContract<TreasuryContract>;
    let dice: SandboxContract<Dice>;
    beforeAll(async () => { code = await compile('Dice'); });
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        owner = await blockchain.treasury('owner');
        player = await blockchain.treasury('player');
        dice = blockchain.openContract(Dice.createFromConfig({
            owner: owner.address,
            max_bet_profit: toNano(10),
            house_edge_x10: BigInt(50),
            }, code));
        const deployResult = await dice.sendDeploy(deployer.getSender(), toNano(300));
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: dice.address,
            deploy: true,
            success: true, }); });
    it('Top Up', async () => {
        const sendTopUpResult = await dice.sendTopUp(owner.getSender(), toNano(100));
        printTransactionFees(sendTopUpResult.transactions);
        expect(sendTopUpResult.transactions).toHaveTransaction({ from: owner.address, to: dice.address, success: true, }); });
    it('Setup', async () => {
        const cs = (await dice.getData()).beginParse();
        const owner_addr = cs.loadAddress();
        const max_bet_profit = cs.loadCoins();
        const house_edge_x10 = cs.loadUint(16);
        expect(owner_addr).toEqualAddress(owner.address);
        expect(max_bet_profit).toStrictEqual(toNano(10)); 
        expect(house_edge_x10).toStrictEqual(50);
        console.log("DATA:" + 
            '\n' + "owner: " + owner + 
            '\n' + "max_bet_profit: " + max_bet_profit + 
            '\n' + "house_edge_x10: " + house_edge_x10);
        const sendSetupResult = await dice.sendSetup(
            deployer.getSender(), toNano(0.05), player.address, toNano(2), BigInt(60));
            printTransactionFees(sendSetupResult.transactions);
            expect(sendSetupResult.transactions).toHaveTransaction({ 
            from: deployer.address, to: dice.address, success: true, });
        const cs_new = (await dice.getData()).beginParse();
        const owner_addr_new = cs_new.loadAddress();
        const max_bet_profit_new = cs_new.loadCoins();
        const house_edge_x10_new = cs_new.loadUint(16);
        expect(owner_addr_new).toEqualAddress(player.address);
        expect(max_bet_profit_new).toStrictEqual(toNano(2)); 
        expect(house_edge_x10_new).toStrictEqual(60);
        console.log("DATA:" + 
            '\n' + "owner_addr_new: " + owner_addr_new + 
            '\n' + "max_bet_profit_new: " + max_bet_profit_new + 
            '\n' + "house_edge_x10_new: " + house_edge_x10_new); });
    it('Withdraw', async () => { 
        const sendWithdrawResult = await dice.sendWithdraw(owner.getSender(), toNano(0.05), toNano(100));
        printTransactionFees(sendWithdrawResult.transactions);
        expect(sendWithdrawResult.transactions).toHaveTransaction({ from: owner.address, to: dice.address, success: true, });
        expect(sendWithdrawResult.transactions).toHaveTransaction({ from: dice.address, to: owner.address, success: true, value: toNano(100), }); });
    // it('LO Victory', async () => {
    //     const sendBetResult = await dice.sendBet(player.getSender(), toNano(1), BigInt(3), BigInt(0));
    //     expect(sendBetResult.transactions).toHaveTransaction({ from: player.address, to: dice.address, success: true, });
    //     expect(sendBetResult.transactions).toHaveTransaction({ from: dice.address, to: player.address, success: true, value: toNano(2), }); });
    // it('Loss', async () => {
    //     const sendBetResult = await dice.sendBet(player.getSender(), toNano(1), BigInt(3), BigInt(1));
    //     expect(sendBetResult.transactions).toHaveTransaction({ from: player.address, to: dice.address, success: true, });
    //     expect(sendBetResult.transactions).toHaveTransaction({ from: dice.address, to: owner.address, }); });
    // it('HI Victory', async () => {
    //     const sendBetResult = await dice.sendBet(player.getSender(), toNano(1), BigInt(3), BigInt(1));
    //     expect(sendBetResult.transactions).toHaveTransaction({ from: player.address, to: dice.address, success: true, });
    //     expect(sendBetResult.transactions).toHaveTransaction({ from: dice.address, to: player.address, success: true, value: toNano(2), }); });
    // it('Win Profit > Max Win Profit', async () => {
    //     const sendBetResult = await dice.sendBet(player.getSender(), toNano(8), BigInt(3), BigInt(1));
    //     expect(sendBetResult.transactions).toHaveTransaction({ from: player.address, to: dice.address, success: true, });
    //     expect(sendBetResult.transactions).toHaveTransaction({ from: dice.address, to: owner.address, }); });
});
