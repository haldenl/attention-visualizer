# attention-visualizer

A tool for visualizing attention in sequence-to-sequence summarization models. Built in React, using D3.

The example data presented was generated using a pre-trained model by See et al (2017).

## Loading your own data

You can view the behavior of your own models by opening the Data Sources panel in the lower right. Data should follow the following format:

```
{
  "attentionRecords": [{
    "inputIndex": 0,
    "outputIndex": 0,
    "weight": 1
  }, 
  {
    "inputIndex": 1,
    "outputIndex": 0,
    "weight": 0
  }],

  "inputTokens": [{
    "index": 0,
    "token": "word"
  }, 
  {
    "index": 1,
    "token": "example"
  }],

  "outputTokens": [{
    "index": 0,
    "token": "word"
  }, 
  {
    "index": 1,
    "token": "example"
  }]
}
```
