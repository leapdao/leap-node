---
title: Data structures
---


## Serialization

### Input

98 bytes

| offset |    size  | value      |
|--------|----------|------------|
| 0      | 32 bytes | prev tx          
| 32     |  1 byte  | output pos        
| 33     | 32 bytes | r-signature        
| 65     | 32 bytes | s-signature        
| 97     |  1 byte  | v-signature         
| 98     |

### Output

54 bytes

| offset |    size  | value      |
|--------|----------|------------|
| 0      | 32 bytes |  value
| 32     |  2 bytes |  color
| 34     | 20 bytes |  address
| 54     |


### Transaction

#### Deposit

60 bytes

| offset |    size  | value      |
|--------|----------|------------|
| 0      |  1 byte  | type
| 1      |  4 bits  | number of inputs (always 1)
| 1      |  4 bits  | number of outputs (always 1)
| 2      |  4 bytes | depositId
| 6      | 32 bytes | value
| 38     |  2 bytes | color
| 40     | 20 bytes | address
| 60     |

#### Transfer

2 bytes + 98 bytes * number of inputs + 54 * number of outputs

E.g. 314 bytes for 2 inputs and 2 outputs

| offset |    size  | value      |
|--------|----------|------------|
| 0      |  1 byte  | type
| 1      |  4 bits  | number of inputs
| 1      |  4 bits  | number of outputs
|        |          | *input 1*
| 2      | 32 bytes | prev tx
| 34     |  1 byte  | output pos
| 35     | 32 bytes | r-signature
| 67     | 32 bytes | s-signature
| 99     |  1 byte  | v-signature
|        |          | *input 2*
| 108    | 32 bytes | prev tx
| 140    |  1 byte  | output pos
| 141    | 32 bytes | r-signature
| 173    | 32 bytes | s-signature
| 205    |  1 byte  | v-signature
|        |          | *output 1*
| 206    | 32 bytes | value
| 238    |  2 bytes | color
| 240    | 20 bytes | address
|        |          | *output 2*
| 260    | 32 bytes |  value
| 292    |  2 bytes |  color
| 294    | 20 bytes |  address
| 314    |

#### Consolidation

167 bytes

| offset |    size  | value      |
|--------|----------|------------|
| 0      |  1 byte  | type
| 1      |  1 byte  | number of inputs
|        |          | *input 1*
| 2      | 32 bytes | prev tx          
| 34     |  1 byte  | output pos        
| 35     | 32 bytes | r-signature        
| 67     | 32 bytes | s-signature        
| 99     |  1 byte  | v-signature         
|        |          | *input 2*
| 100    | 32 bytes | prev tx          
| 132    |  1 byte  | output pos        
| 133    | 32 bytes | r-signature        
| 165    | 32 bytes | s-signature        
| 166    |  1 byte  | v-signature         
| 167    |

## Block
 
## Period

## Proof