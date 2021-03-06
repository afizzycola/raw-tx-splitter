import {fragmentSizes} from './reference_data/fragment_sizes'



function isHex (stringToCheck: string): boolean {
    const hexRegEx: RegExp =  /[0-9A-Fa-f]{6}/g;
    return (hexRegEx.test(stringToCheck)) ? true : false;
}

// to do
function isSerialisedBitcoinTx (stringToCheck: string): void {
    if(!isHex(stringToCheck)) {
        throw new Error('Input Error: Input is not a hex string');
    }
}

interface PreviousOutput {
    transactionHash_LE: string;
    utxoIndex_LE: string;
    utxoScriptSigSizePrefix_BE: string;
    utxoScriptSig_BE: string;
    utxoSequence_LE: string;
}

interface CurrentOutput {
    outputSatoshis_LE: string;
    outputScriptPubkeySizePrefix_BE: string;
    outputScriptPubkey_BE: string;
}

interface PreviousOutputWitness {
    witnessSizePrefix_BE: string;
    witness_BE: string;
}

interface PreviousOutputWitnesses {
    noOfWitnesses_BE: string;
    witnesses: Array<PreviousOutputWitness>;
}




export class SerializedTransaction {
    
    version_LE: string;
    segwitMarker_BE?: string;
    segwitFlag_BE?: string;
    noOfInputs_BE: string;
    inputs: Array<PreviousOutput>;
    noOfOutputs_BE: string;
    outputs: Array<CurrentOutput>;
    witnessesOfInputs: Array<PreviousOutputWitnesses>;
    locktime_LE: string;

    constructor(serialStr: string) {
        
        serialStr = serialStr.trim().replace(/\s/g,'');
        if(!isHex(serialStr)) {
            throw new Error('Input Error: Input is not a hex string');
        }
       
        let readHeadIndex = 0;

        function getRawFragment(serialStr: string, sliceSize: number): string {
            const fragment = serialStr.substring(readHeadIndex, readHeadIndex + sliceSize);
            readHeadIndex += sliceSize;
            return fragment;
        }

        this.version_LE = getRawFragment(serialStr, 8);
        let version_INT = parseInt(this.version_LE.substring(0, 2));
        if(version_INT < 1 || version_INT > 2 ) {
            throw new Error('Input Error: Transaction Version must be either 1 or 2. Anything else is not currently supported by Bitcoin');
        }

        const hasSegwitInputs = (serialStr.substring(8, 10) === "00" && serialStr.substring(10, 12) === "01") ? true : false;
        if (hasSegwitInputs) {
            this.segwitMarker_BE = getRawFragment(serialStr, fragmentSizes.segwitMarker_BE);
            this.segwitFlag_BE = getRawFragment(serialStr, fragmentSizes.segwitFlag_BE);
        }


        this.noOfInputs_BE = getRawFragment(serialStr, fragmentSizes.noOfInputs_BE);
        const noOfInputs_INT = parseInt(this.noOfInputs_BE, 16);

        this.inputs = [];
        for (let i = 0; i < noOfInputs_INT; i++) {

            let input:any = {};

            input.transactionHash_LE = getRawFragment(serialStr, fragmentSizes.transactionHash_LE);
            input.utxoIndex_LE = getRawFragment(serialStr, fragmentSizes.utxoIndex_LE);

            const compact_size:string = getRawFragment(serialStr, fragmentSizes.compactSize_BE);
            input.utxoScriptSigSizePrefix_BE = compact_size;
            if(parseInt(compact_size, 16) > 0) {
                input.utxoScriptSig_BE = getRawFragment(serialStr, parseInt(compact_size, 16)*2 );
            }

            input.utxoSequence_LE = getRawFragment(serialStr, fragmentSizes.utxoSequence_LE);
            
            this.inputs.push(input);
        }

        this.noOfOutputs_BE = getRawFragment(serialStr, fragmentSizes.noOfOutputs_BE);
        const numberOfOutputs_INT = parseInt(this.noOfOutputs_BE, 16);

        //we work out the compact size of the script_pubbkey
        //so we know how big and therefore how much to slice out of the string
        this.outputs = [];
        for (let i = 0; i < numberOfOutputs_INT; i++) {
        
            let output: any = {};
            output.outputSatoshis_LE = getRawFragment(serialStr, fragmentSizes.outputSatoshis_LE);

            const compact_size:string = getRawFragment(serialStr, fragmentSizes.compactSize_BE);
            output.outputScriptPubkeySizePrefix_BE = compact_size;
            output.outputScriptPubkey_BE = getRawFragment(serialStr, parseInt(compact_size, 16)*2);
            
            this.outputs.push(output);
        }

        if (hasSegwitInputs) {
                        
            this.witnessesOfInputs = [];

            while (readHeadIndex < serialStr.length - fragmentSizes.locktime_LE ) {
                let previousOutputWitnesses:any = {};
                
                previousOutputWitnesses.noOfWitnesses_BE = getRawFragment(serialStr, fragmentSizes.noOfWitnesses_BE);
                const noOfWitnesses_INT = parseInt(previousOutputWitnesses.noOfWitnesses_BE);
                previousOutputWitnesses.witnesses = [];
                

                for (let i = 0; i < noOfWitnesses_INT; i++) {
                    let previousOutputWitness:any = {};
                    const compact_size:string = getRawFragment(serialStr, fragmentSizes.compactSize_BE);
                    previousOutputWitness.witnessSizePrefix_BE = compact_size;
                    previousOutputWitness.witness_BE = getRawFragment(serialStr, parseInt(compact_size, 16)*2);
                    previousOutputWitnesses.witnesses.push(previousOutputWitness);
                }
                this.witnessesOfInputs.push(previousOutputWitnesses);
            }
            
        }
        this.locktime_LE = getRawFragment(serialStr, fragmentSizes.locktime_LE)//serialStr.slice(serialStr.length - fragmentSizes.locktime_LE)

    }

    getOutpoint(inputIndex: number):string {
        const required_input = this.inputs[inputIndex];
        return required_input.transactionHash_LE + required_input.utxoIndex_LE;
    }
    
}
