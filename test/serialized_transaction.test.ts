import {SerializedTransaction} from "../ts_src/serialized_transaction"
import {test_data} from "./instance_data/serialized_transaction.data";


test('1. segwit inputs, 1 input 2 outputs, no witnesses', () => {
    expect(new SerializedTransaction(test_data.segwitv0_1in_2out_INPUT)).toEqual(test_data.segwitv0_1in_2out_RESULT);
});

test('2. segwit inputs, 1 input 2 outputs, no witnesses', () => {
    expect(new SerializedTransaction(test_data.segwitv0_1in_1out_INPUT)).toEqual(test_data.segwitv0_1in_1out_RESULT);
});

test('3. legacy inputs, 2 inputs 1 output, therefore no witnesses', () => {
    expect(new SerializedTransaction(test_data.legacy_2in_1out_INPUT)).toEqual(test_data.legacy_2in_1out_RESULT);
});

test('4. mix of legacy and segwit inputs, 7 inputs 2 outputs, has witnesses', () => {
    expect(new SerializedTransaction(test_data.mix_7in_2out_INPUT)).toEqual(test_data.mix_7in_2out_RESULT);
});

test('5. coinbase tx, 1 input 3 outputs, has (coinbase) witness', () => {
    expect(new SerializedTransaction(test_data.coinbase_1in_3out_INPUT)).toEqual(test_data.coinbase_1in_3out_RESULT);
});