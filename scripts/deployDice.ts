import { toNano } from '@ton/core';
import { Dice } from '../wrappers/Dice';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const dice = provider.open(Dice.createFromConfig({}, await compile('Dice')));

    await dice.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(dice.address);

    // run methods on `dice`
}
