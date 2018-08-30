# Attention Visualizer

Use it! [haldenl.github.io/attention-visualizer](haldenl.github.io/attention-visualizer)

A tool for visualizing attention in sequence-to-sequence summarization models. Built with D3 + React.

Publication:
[Visualizing Attention in Sequence-to-Sequence Summarization Models](haldenl.com/papers/2018-vast-attention), (poster) VAST 2018

The example data presented was generated using a pre-trained model by See et al (2017): [Get To The Point: Summarization with Pointer-Generator Networks](https://arxiv.org/pdf/1704.04368.pdf).

## Loading your own data

You can view the behavior of your own models by opening the Data Sources panel in the lower right, and adding a url to your own data. Data should follow the following format:

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

## Running locally
Use the command `yarn` to install dependencies, then `yarn start` to run a local instance.
