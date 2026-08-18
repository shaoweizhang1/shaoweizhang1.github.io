---
title: "Building Machines That Learn and Think Like People"
date: "2026-08-02"
tags: ["cognitive-science", "deep-learning"]
summary: "Everyone should read it. Written before the era of LLM but indicated the capabilities of AI now, although the path is not what the paper argued for. Some of its views look outdated now, but it still gives an overview about what intelligence should be like and what today's systems miss."
paper:
  title: "Building Machines That Learn and Think Like People"
  authors: "Lake, B. M., Ullman, T. D., Tenenbaum, J. B., & Gershman, S. J."
  year: 2017
  venue: "Behavioral and Brain Sciences"
  url: "https://arxiv.org/abs/1604.00289"
---

This is one of those papers that's less about a new model but more about a diagnosis: deep learning was (and still is) very good at pattern recognition, but that's far away from human's way of learning. The paper argues for some "ingredients" that they think are missing in deep learning, using two toy problems as examples.

## Pattern recognition vs. model building

The main difference the paper draws is: a *pattern recognition* system learns a mapping from inputs to outputs by finding statistical regularities across a huge amount of data. A *model-building* system tries to explain the data — to construct a causal story of how the observations should be, which can then be used to predict, imagine, and plan. Their claim is that human cognition is fundamentally the second kind, and most deep learning (around 2017, and also still today) is the first kind.

They changed a view to transfer the problems like "why isn't this network more human-like" into one specific question: is it building a model of the world, or just fitting a function?

## Two challenge problems

The paper uses two examples to make the gap concrete: the *Characters Challenge* (people can learn a new handwritten character from a single example, something the deep learning at that time couldn't do), and the *Frostbite Challenge* (DQN needed ~924 hours of gameplay to reach human performance on Frostbite, while a person gets there in minutes).

## The core ingredients of human intelligence

1. **Intuitive physics** — even young infants expect objects to be solid, continuous, and to persist over time. This basic sense of how physical things behave is there before any formal learning starts.
2. **Intuitive psychology** — infants also read other people as agents with goals early on, not just moving shapes. This lets them predict and learn from what others do.
3. **Compositionality** — new concepts are built from a small set of reusable parts (strokes, parts, sub-goals), the same way language builds endless sentences from a finite set of words.
4. **Causality** — a good model doesn't just produce data that looks right, it reflects how the data was actually generated. That's what lets one example support real generalization.
5. **Learning-to-learn** — experience with earlier, related tasks shapes how quickly you pick up the next one.

None of these are really about *more data* or *more parameters*. They're about the *structure* of what's being learned.

## Thinking fast

They raised an honest objection: rich causal/compositional models usually lead to expensive inference, but human perception and thought are fast. Their explanation is that people combine slow model-based reasoning with fast, amortized, "model-free" pattern recognition — essentially caching the outputs of expensive inference so that familiar cases can be recognized instantly, while novel or hard cases fall back to slower model-based reasoning. This is basically the model-based/model-free split from RL, generalized to cognition.

## What I think, after a decade

This paper almost predicted where AI would go over the next ten years. Looking at Section 6.2 ("Future applications to practical AI problems"), the results it foresaw have mostly happened — yet not through the path it argued for. Meanwhile, we've become more and more fascinated by the idea that pattern recognition — next-token prediction — will lead us to AGI. Because of this, we often forget that today's LLMs still hallucinate, still raise real ethical problems, and are sometimes hard to control. Everyone should read this paper. A lot of its claims now look outdated when thinking about LLM-era neural networks, but its summary of the technology of that time, and especially its category on cognition, is still worth reading.

But why should building machine intelligence require building something that thinks like a human? The success of LLMs is persuading that intelligence can emerge from something as "simple" as pattern recognition — next-token prediction — without most of the ingredients this paper insists are necessary. Maybe creating intelligence doesn't have to take human intelligence as its blueprint.

However, there's no doubt LLMs are still an incomplete form of intelligence. Understanding how human intelligence works remains important for where AI goes next.
