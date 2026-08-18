---
title: "DeepProbLog, Neural Probabilistic Logic Programming"
date: "2026-08-11"
tags: ["problog", "deepproblog", "neuro-symbolic"]
summary: "A neural network plus ProbLog brings one of the important results in neuro-symbolic AI: exact probabilistic reasoning with a network's power to fit. The method and the experiments are elegant, and the results are surprising."
paper:
  title: "DeepProbLog: Neural Probabilistic Logic Programming"
  authors: "Manhaeve, R., Dumančić, S., Kimmig, A., Demeester, T., & De Raedt, L."
  year: 2018
  venue: "NeurIPS"
  url: "https://arxiv.org/abs/1805.10872"
---

My [Pro<span class="accent-letter">b</span>Log notes](/reading-notes/problog-a-probabilistic-prolog) ended with an obvious limitation: Pro<span class="accent-letter">b</span>Log cannot learn probabilities from data. Every `p::fact` needs a probability from somewhere: either write it down yourself, or compute it somewhere else and then give it to Pro<span class="accent-letter">b</span>Log. In its own biology experiment, for example, the edge weights were already provided. Pro<span class="accent-letter">b</span>Log is very good at reasoning once you give it a probabilistic model, but it has no way to learn that model by itself.

**<span class="accent-letter">Deep</span>ProbLog** fixes exactly this problem. Instead of manually specifying every probability, you can let a neural network produce some of them. The logic part still does exact probabilistic inference, while the neural network handles inputs that are hard to describe symbolically and learns from data with gradient descent. This is basically the idea of neuro-symbolic AI in a very clean form: use neural networks for perception and learning, and logic for structured reasoning.

What I like most is how little Pro<span class="accent-letter">b</span>Log actually has to change. The authors do not redesign the whole language or build a complicated new system. They add one new kind of declaration, the neural predicate, and leave the rest of Pro<span class="accent-letter">b</span>Log almost untouched. The question of the paper is basically: how small can the neural part be while still making the whole system learnable? The answer turns out to be surprisingly small.

## The syntax of DeepProbLog

Three steps get you from Pro<span class="accent-letter">b</span>Log to <span class="accent-letter">Deep</span>ProbLog.

### Step 1 — a number on a fact

A Pro<span class="accent-letter">b</span>Log program is a set of facts, each with a probability, plus ordinary Prolog rules. Here is an example from the paper:

<div class="code-annotated">
<div><code>0.1::burglary.</code><p>The probability of a burglary is 0.1</p></div>
<div><code>0.2::earthquake.</code><p>The probability of an earthquake is 0.2. It's unrelated to the burglary.</p></div>
<div><code>0.5::hears_alarm(mary).</code><p>If the alarm goes off, Mary hears it with a probability of 0.5</p></div>
<div><code>0.4::hears_alarm(john).</code><p>John hears: 0.4</p></div>
<div class="gap"><code> </code><p></p></div>
<div><code>alarm :- earthquake.</code><p>This is a rule, which means: an earthquake set the alarm off. There is no probability on a rule. Given the body, the head happens.</p></div>
<div><code>alarm :- burglary.</code><p>So does a burglary. Two rules with the same head means either one is enough to set off the alarm.</p></div>
<div><code>calls(X) :- alarm, hears_alarm(X).</code><p>X calls if the alarm went off <em>and</em> X heard it</p></div>
</div>

Each fact is independent. Sample all of them and you get one *possible world*, a plain Prolog program. The probability of a query is then the total probability of all the worlds in which that query succeeds. The rules are Prolog, untouched. The number in front is the only new thing.

And importantly, each fact is just its own yes/no choice. Nothing here says that two facts cannot both be true at the same time.


### Step 2 — syntactic sugar: annotated disjunctions

Often the alternatives exclude each other and their probabilities add up to one — like the severity of an earthquake: Nothing happens: 0.4; Mild earthquake: 0.4; Severe: 0.2. With Step 1 alone you have to build that by hand:

```prolog
0.4::a1.
0.6667::a2.

earthquake(none)   :- a1.
earthquake(mild)   :- \+a1, a2.
earthquake(severe) :- \+a1, \+a2.
```

Now you need sequential tests, negation to keep the cases separate, and rescaled probabilities. The 0.2 probability you actually care about does not even appear directly in the program.

Pro<span class="accent-letter">b</span>Log has a short form for that case: semicolons instead of separate lines.

```prolog
0.4::earthquake(none); 0.4::earthquake(mild); 0.2::earthquake(severe).
```

Only one of the three will happen. This is an **annotated disjunction** (AD). It says the same thing as the block above — the paper calls it "nothing else than syntactic sugar" — but each alternative now carries its own probability, so the numbers read directly.

It is also the shape of a softmax. Remember that.

### Step 3 — the number comes from a neural network (nn)

A softmax over n classes outputs n non-negative numbers that add up to one. That is exactly what an AD needs. So in <span class="accent-letter">Deep</span>ProbLog neural networks can supply them.


An ordinary AD uses the same probabilities every time. For example:

```prolog
0.1::result(excellent); 0.5::result(pass); 0.4::result(fail).
```

This says that the probabilities are always 0.1, 0.5, and 0.4. But for something like an exam result, we probably want them to depend on the student.
<span class="accent-letter">Deep</span>ProbLog lets a neural network produce those numbers:

```prolog
nn(m_exam, Student, [excellent,pass,fail]) ::
    result(Student,excellent);
    result(Student,pass);
    result(Student,fail).
```
This is still an annotated disjunction: exactly one of the three outcomes is true, and their probabilities add up to one. The only difference is where the probabilities come from. Instead of writing them down, `m_exam` takes `Student` as input and outputs a distribution over `excellent`, `pass`, and `fail`.
So Alice and Bob can now have different probabilities:
`result(alice,pass)` might have probability 0.8, while `result(bob,pass)` might have probability 0.3.

In general, a **neural annotated disjunction** (nAD) is written

$$
nn(m_q, \mathbf{t}, \mathbf{u}) :: q(\mathbf{t},u_1);\ \ldots;\ q(\mathbf{t},u_n) \leftarrow b_1,\ldots,b_m
$$


Here, $m_q$ is the neural network, $\mathbf{t}$ is its input, and $u_1,\ldots,u_n$ are the possible outputs. Once the network has produced the probabilities, that is, once it is grounded, the result is just an ordinary AD. Pro<span class="accent-letter">b</span>Log can then reason with it exactly as before.
This is basically the whole extension: the logic stays the same; the probabilities can now come from a neural network.

### What that buys

The paper's example is MNIST addition. The whole program is basically two lines:

```prolog
nn(m_digit, X, [0,...,9]) :: digit(X,0); ... ; digit(X,9).

addition(X,Y,Z) :- digit(X,X2), digit(Y,Y2), Z is X2+Y2.
```

`m_digit` is a small CNN, and `X` is the input image. `[0,...,9]` are the ten possible digits `X` can be. The network outputs a probability for each one through a softmax, and exactly one of them is chosen.

The second line is just ordinary Prolog. It knows nothing about pixels. `X` and `Y` are images, `X2` and `Y2` are the digits recognized from them, and `is` calculates the sum. So the first line turns an image into a digit, and the second turns two digits into their sum.

The interesting part is how this is trained. The training data only gives pairs of images and their sum:

`addition(a, b, 8)`

There is no label saying what digit is in `a` or `b`. The outputs of the digit network are therefore **latent variables**. Supervision only arrives at the final sum, and the learning signal has to pass backward through the Pro<span class="accent-letter">b</span>Log program to teach the network which digits were probably in the two images.

This is what the second line buys you. A normal digit classifier would need a label for every image. Here, the addition rule provides the structure instead. As the paper points out, you could train a CNN to take two images and predict their sum directly, but then the network would also have to learn what addition means. In <span class="accent-letter">Deep</span>ProbLog, addition is already given as background knowledge; the network only has to learn how to read the digits.


## Inference, almost unchanged

Take the burglary program as example: from Step 1 for `calls(mary)`. Pro<span class="accent-letter">b</span>Log answers in four steps.

**1. Ground.** Keep only the clauses the query depends on, and fill in the variables::


```prolog
0.2::earthquake.
0.1::burglary.
alarm :- earthquake.
alarm :- burglary.
0.5::hears_alarm(mary).
calls(mary) :- alarm, hears_alarm(mary).
```

`hears_alarm(john)` is gone because `calls(mary)` does not depend on it.

**2. Rewrite.** Turn the grounded program into a propositional formula over the probabilistic facts:

$$
\textsf{calls(mary)} \leftrightarrow \textsf{hears\_alarm(mary)} \wedge (\textsf{burglary} \vee \textsf{earthquake})
$$

Now the query has been reduced to a formula over three yes/no random variables.

**3. Compile.** Turn that formula into a *Sentential Decision Diagram* (SDD), a circuit where the probability can be computed efficiently.

The logical meaning has not changed. The SDD is just a better form for calculation.

<figure class="paper-diagram">
<svg viewBox="0 0 600 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sentential decision diagram for the query calls(mary). The query node sits above an or-node of value 0.14, whose two children are and-nodes of value 0.04 and 0.1. The 0.04 node combines hears_alarm(mary) with a further and-node of value 0.08 over not-earthquake and burglary; the 0.1 node combines earthquake with the same hears_alarm(mary) leaf, which both branches share.">
<g stroke="currentColor" stroke-opacity="0.4" stroke-width="1.4" fill="none">
<path d="M300,46 L300,76"/>
<path d="M300,104 L196,143"/>
<path d="M300,104 L432,143"/>
<path d="M188,171 L128,210"/>
<path d="M200,171 L344,278"/>
<path d="M120,238 L74,278"/>
<path d="M128,238 L204,278"/>
<path d="M436,171 L494,278"/>
<path d="M424,171 L360,278"/>
</g>
<g font-family="ui-monospace, monospace" font-size="12" text-anchor="middle">
<rect x="238" y="18" width="124" height="28" rx="6" fill="none" stroke="#ea580c" stroke-opacity="0.7"/>
<text x="300" y="37" fill="currentColor">calls(mary)</text>
<text x="378" y="37" fill="currentColor" fill-opacity="0.5" font-size="11" text-anchor="start">0.14</text>
<rect x="276" y="76" width="48" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.45"/>
<text x="300" y="95" fill="currentColor" fill-opacity="0.8">or</text>
<rect x="166" y="143" width="48" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.45"/>
<text x="190" y="162" fill="currentColor" fill-opacity="0.8">and</text>
<text x="222" y="162" fill="currentColor" fill-opacity="0.5" font-size="11" text-anchor="start">0.04</text>
<rect x="412" y="143" width="48" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.45"/>
<text x="436" y="162" fill="currentColor" fill-opacity="0.8">and</text>
<text x="468" y="162" fill="currentColor" fill-opacity="0.5" font-size="11" text-anchor="start">0.1</text>
<rect x="100" y="210" width="48" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.45"/>
<text x="124" y="229" fill="currentColor" fill-opacity="0.8">and</text>
<text x="156" y="229" fill="currentColor" fill-opacity="0.5" font-size="11" text-anchor="start">0.08</text>
</g>
<g font-family="ui-monospace, monospace" font-size="11" text-anchor="middle">
<rect x="16" y="278" width="116" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.3"/>
<text x="74" y="296" fill="currentColor" fill-opacity="0.75">¬earthquake</text>
<text x="74" y="320" fill="currentColor" fill-opacity="0.45" font-size="10">0.8</text>
<rect x="166" y="278" width="76" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.3"/>
<text x="204" y="296" fill="currentColor" fill-opacity="0.75">burglary</text>
<text x="204" y="320" fill="currentColor" fill-opacity="0.45" font-size="10">0.1</text>
<rect x="284" y="278" width="152" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.3"/>
<text x="360" y="296" fill="currentColor" fill-opacity="0.75">hears_alarm(mary)</text>
<text x="360" y="320" fill="currentColor" fill-opacity="0.45" font-size="10">0.5</text>
<rect x="452" y="278" width="88" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.3"/>
<text x="496" y="296" fill="currentColor" fill-opacity="0.75">earthquake</text>
<text x="496" y="320" fill="currentColor" fill-opacity="0.45" font-size="10">0.2</text>
</g>
</svg>
<figcaption>The SDD for calls(mary), following Figure 1b of the paper. Both branches reach the same hears_alarm(mary) leaf — that sharing is the whole point of compiling to a circuit.</figcaption>
</figure>

**4. Evaluate.** Walk the circuit bottom-up from the probabilities at the leaves. At an and-node, multiply; at an or-node, add the separate cases.
For `calls(mary)`, one case is a burglary without an earthquake: $0.8 \times 0.1 \times 0.5 = 0.04$. The other is an earthquake, whether or not there was also a burglary: $0.2 \times 0.5 = 0.1$. So $P(\textsf{calls(mary)}) = 0.04 + 0.1 = \mathbf{0.14}.$


<span class="accent-letter">Deep</span>ProbLog changes the first step only slightly. When grounding reaches a neural predicate, it first needs probabilities for that particular input. The network runs, its softmax produces those probabilities, and the neural predicate becomes an ordinary ground AD. From that point on, Pro<span class="accent-letter">b</span>Log can treat it like any other probabilistic choice.

<div class="step-compare"><div><p class="step-compare-label">Pro<span class="accent-letter">b</span>Log</p><p class="step-compare-label"><span class="accent-letter">Deep</span>ProbLog</p></div><div><p data-side="ProbLog">1. Ground the program against the query.</p><p data-side="DeepProbLog">1. Ground the program against the query — and every time grounding meets a neural predicate, run its network and take the softmax as that AD&#39;s probabilities.</p></div><div><p data-side="ProbLog">2. Rewrite the ground program into a propositional formula.</p><p data-side="DeepProbLog">2. The same.</p></div><div><p data-side="ProbLog">3. Compile the formula into an SDD.</p><p data-side="DeepProbLog">3. The same.</p></div><div><p data-side="ProbLog">4. Evaluate bottom-up: multiply at and-nodes, add at or-nodes.</p><p data-side="DeepProbLog">4. The same.</p></div></div>

So the neural network does not replace Pro<span class="accent-letter">b</span>Log's inference. It just supplies some of the probabilities that inference works with. The logic, the possible-world semantics, and the compiled circuit all stay the same.

One thing is worth noticing here. The network runs during grounding, once for each query, and a new circuit has to be built whenever a query has a new shape. This is where most of the cost of <span class="accent-letter">Deep</span>ProbLog comes from, and I come back to it below.


## Training

There are two kinds of parameters to learn: probabilities written directly into the program, and the weights of the neural networks. <span class="accent-letter">Deep</span>ProbLog trains both with the same loss.

### What the loss is

The setting is called *learning from entailment*. The training data tells us which queries should be true, or more generally what probability they should have.

For MNIST addition, a training example looks like

`addition(a,b,8)`

and we want the program to give this query probability 1.

In general, the objective is

$$
\arg\min_{\mathbf{x}} \frac{1}{|Q|}\sum_{(q,p)\in Q} L\big(P_{\mathcal{X}=\mathbf{x}}(q),\ p\big)
$$

where $p$ is the target probability and $L$ is cross-entropy in the experiments.

Notice what is missing from this loss: there is nothing about digit labels, neural networks, or individual probabilistic facts. It only says that the final queries should get the right probabilities.

So the problem becomes: how does the probability of a query change when we change one of the parameters?

### One walk, two things

For inference, each node in the circuit only needs to carry a probability. For training, it carries both the probability and its derivatives with respect to the parameters.

Take the same `calls(mary)` example, and suppose we want to learn the probabilities of `earthquake` and `burglary`.

Each leaf now carries a pair: its probability, followed by its derivatives with respect to those two parameters.

- `earthquake` is itself the first parameter, so it carries $(0.2;\ 1,0)$.
- `burglary` is the second, so it carries $(0.1;\ 0,1)$.
- `hears_alarm(mary)` is fixed at 0.5, so it carries $(0.5;\ 0,0)$.
- `¬earthquake` has probability $1-0.2=0.8$, so it carries $(0.8;\ -1,0)$.

The $-1$ just says that if the probability of `earthquake` goes up, the probability of `¬earthquake` goes down by the same amount.

From there, only two rules are needed. At an or-node, add. At an and-node, multiply the probabilities and use the product rule for the derivatives:

$$
(a, \vec{a}') \oplus (b, \vec{b}') =
(a+b,\ \vec{a}'+\vec{b}')
$$

$$
(a, \vec{a}') \otimes (b, \vec{b}') =
(ab,\ a\vec{b}' + b\vec{a}')
$$

These two operations define the **gradient semiring**.

Now the same bottom-up walk through the circuit gives us two things at once: the probability of the query, and how that probability changes with every learnable parameter.

<figure class="paper-diagram">
<svg viewBox="0 0 600 348" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The same SDD for calls(mary), now with a gradient beside every probability. The leaves carry pairs: not-earthquake 0.8 with gradient minus one and zero, burglary 0.1 with zero and one, hears_alarm(mary) 0.5 with zero and zero, earthquake 0.2 with one and zero. Combining upwards gives 0.08 with gradient minus 0.1 and 0.8, then 0.04 with minus 0.05 and 0.4 on one branch and 0.1 with 0.5 and 0 on the other, and finally 0.14 at the top with gradient 0.45 and 0.40.">
<g stroke="currentColor" stroke-opacity="0.4" stroke-width="1.4" fill="none">
<path d="M300,46 L300,76"/>
<path d="M300,104 L196,143"/>
<path d="M300,104 L432,143"/>
<path d="M188,171 L128,210"/>
<path d="M200,171 L344,278"/>
<path d="M120,238 L74,278"/>
<path d="M128,238 L204,278"/>
<path d="M436,171 L494,278"/>
<path d="M424,171 L360,278"/>
</g>
<g font-family="ui-monospace, monospace" font-size="12" text-anchor="middle">
<rect x="238" y="18" width="124" height="28" rx="6" fill="none" stroke="#ea580c" stroke-opacity="0.7"/>
<text x="300" y="37" fill="currentColor">calls(mary)</text>
<rect x="276" y="76" width="48" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.45"/>
<text x="300" y="95" fill="currentColor" fill-opacity="0.8">or</text>
<rect x="166" y="143" width="48" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.45"/>
<text x="190" y="162" fill="currentColor" fill-opacity="0.8">and</text>
<rect x="412" y="143" width="48" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.45"/>
<text x="436" y="162" fill="currentColor" fill-opacity="0.8">and</text>
<rect x="100" y="210" width="48" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.45"/>
<text x="124" y="229" fill="currentColor" fill-opacity="0.8">and</text>
</g>
<g font-family="ui-monospace, monospace" font-size="11" text-anchor="start">
<text x="376" y="31" fill="currentColor" fill-opacity="0.55">0.14</text>
<text x="376" y="45" fill="#5c9ce6">0.45, 0.40</text>
<text x="222" y="156" fill="currentColor" fill-opacity="0.55">0.04</text>
<text x="222" y="170" fill="#5c9ce6">-0.05, 0.4</text>
<text x="468" y="156" fill="currentColor" fill-opacity="0.55">0.1</text>
<text x="468" y="170" fill="#5c9ce6">0.5, 0</text>
<text x="156" y="223" fill="currentColor" fill-opacity="0.55">0.08</text>
<text x="156" y="237" fill="#5c9ce6">-0.1, 0.8</text>
</g>
<g font-family="ui-monospace, monospace" font-size="11" text-anchor="middle">
<rect x="16" y="278" width="116" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.3"/>
<text x="74" y="296" fill="currentColor" fill-opacity="0.75">¬earthquake</text>
<text x="74" y="320" fill="currentColor" fill-opacity="0.45" font-size="10">0.8</text>
<text x="74" y="334" fill="#5c9ce6" font-size="10">-1, 0</text>
<rect x="166" y="278" width="76" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.3"/>
<text x="204" y="296" fill="currentColor" fill-opacity="0.75">burglary</text>
<text x="204" y="320" fill="currentColor" fill-opacity="0.45" font-size="10">0.1</text>
<text x="204" y="334" fill="#5c9ce6" font-size="10">0, 1</text>
<rect x="284" y="278" width="152" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.3"/>
<text x="360" y="296" fill="currentColor" fill-opacity="0.75">hears_alarm(mary)</text>
<text x="360" y="320" fill="currentColor" fill-opacity="0.45" font-size="10">0.5</text>
<text x="360" y="334" fill="#5c9ce6" font-size="10">0, 0</text>
<rect x="452" y="278" width="88" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.3"/>
<text x="496" y="296" fill="currentColor" fill-opacity="0.75">earthquake</text>
<text x="496" y="320" fill="currentColor" fill-opacity="0.45" font-size="10">0.2</text>
<text x="496" y="334" fill="#5c9ce6" font-size="10">1, 0</text>
</g>
</svg>
<figcaption>The same circuit as before. Grey is the probability, blue the derivative with respect to (earthquake, burglary). Following the paper's Figure 1b.</figcaption>
</figure>

Out the top comes $(0.14;\ 0.45,\ 0.40)$. The first number is the probability we already got from inference. The other two tell us how that probability changes: increase `earthquake` a little, and $P(\textsf{calls(mary)})$ increases about 0.45 times as much; increase `burglary`, and it increases about 0.40 times as much.

So one bottom-up pass gives both the exact probability and its exact derivatives. The trick was already available in **aProbLog**, an earlier system from the same group: the same compiled circuit can be evaluated with different semirings. For ordinary inference, use the probability semiring. For learning, use the gradient semiring.

### Two kinds of parameter

Those gradients now have two different places to go.

**Logic parameters** are probabilities written directly in the program, such as `t(0.5)::fact`. In our example, `earthquake` and `burglary` would be parameters of this kind. The gradient semiring gives their derivatives directly, so an optimizer can update them.

There is one extra step for an AD: its probabilities must still add up to one. After an update, <span class="accent-letter">Deep</span>ProbLog normalises them again. This turns out to matter more than it first seems, and I come back to it in the reproduction section.

**Neural parameters** are different. The gradient semiring never sees the weights inside the network. It only sees the probabilities coming out of the softmax and treats those outputs like ordinary parameters.

So the logic side computes how the loss changes with respect to those output probabilities. That gradient is then handed back to the neural network, and normal backpropagation takes it from there to update the network weights.

The neural AD does not need the extra normalisation step: its softmax already makes the output probabilities add up to one.

So the two sides barely need to know anything about each other. The network sends probabilities into the logic program; the logic program sends gradients back.

That interface is the key idea. Most of the machinery on either side — Pro<span class="accent-letter">b</span>Log's semantics and inference, SDDs, aProbLog and the gradient semiring, and ordinary neural-network backpropagation — was already there. <span class="accent-letter">Deep</span>ProbLog connects them at exactly one point.

## Experiments and Reproduction

I reproduced all six experiments in the paper on one machine, using the official [library](https://github.com/ML-KULeuven/deepproblog) as a normal pip dependency. Nothing is copied into my own codebase, so what I am testing is the library's behaviour rather than my own reimplementation. Every hyperparameter is a flag and every run is a shell script; the code, logs and figures are all [on GitHub](https://github.com/shaoweizhang1/DeepProbLog_Reproduction).

Five of the six experiments worked. One did not, and figuring out why turned out to be more interesting than the final number.

### T1 — single-digit addition

The task is to add two MNIST images. A query looks like `addition(a, b, 8)`, where `a` and `b` are the images. The whole <span class="accent-letter">Deep</span>ProbLog model is the same two lines from earlier: a neural AD for `digit/2`, and one Prolog rule for addition. The baseline is a CNN that sees the same two images and predicts the sum directly as one of 19 classes.

![T1: training loss and test accuracy against iterations, for DeepProbLog and two CNN baselines](https://raw.githubusercontent.com/shaoweizhang1/DeepProbLog_Reproduction/main/deepproblog_demo/figs/t1.png)

| Model                                          | Test accuracy |
| ---------------------------------------------- | ------------- |
| <span class="accent-letter">Deep</span>ProbLog | **96.6%**     |
| CNN, shared encoder per image                  | 85.9%         |
| CNN, both images concatenated                  | 75.4%         |

The training budget is matched throughout: same training set, batch size, number of iterations and evaluation schedule, so one step means the same amount of data on every curve. I evaluate the curves on 500 test examples every thousand iterations, while the table uses the full test set at the end. That is why the last point on a curve can be a couple of points away from its table entry.

The overall shape matches the paper. <span class="accent-letter">Deep</span>ProbLog passes 85% after about a thousand iterations and 90% after about three thousand, then mostly levels off. The concatenation CNN is still improving at sixty thousand iterations, while the shared-encoder CNN levels off much earlier. A separate 30,000-iteration run of the shared-encoder model reached 87.1%, slightly above the 85.9% here, so the difference near the end is mostly run-to-run variation.

The ordering also makes sense. The shared-encoder CNN already has part of the right structure built into its architecture: look at each image separately, then combine the two representations. The concatenation CNN has to discover that decomposition from pixels by itself.

The paper only released the shared-encoder baseline. The CNN shown in the paper's plot — one convolutional network over both images at once — is not in the repository, so I rebuilt it from the architecture description. The details only line up if the two images are stacked as channels: that keeps the 16×4×4 feature map implied by the paper, while putting the images side by side would give 16×4×11 and make the first fully connected layer much larger. The paper says the digit network has about 44k parameters; I get 44,426 for the 1-channel, 10-output network, and 45,341 for the baseline with 2 input channels and 19 outputs.

### T2 — multi-digit addition

The task is the same, except each argument is now a *list* of images representing a multi-digit number. The network does not change; only the logic program gets two extra lines. It is trained on single digits and then tested on three-digit numbers, with no retraining in between.

![T2: training loss and test accuracy against iterations, for DeepProbLog and the CNN baseline](https://raw.githubusercontent.com/shaoweizhang1/DeepProbLog_Reproduction/main/deepproblog_demo/figs/t2.png)

| Model                                          | Test accuracy |
| ---------------------------------------------- | ------------- |
| <span class="accent-letter">Deep</span>ProbLog | **92.4%**     |
| CNN, shared encoder per image                  | 13.0%         |

This is probably the result that makes the clearest case for the whole approach. The <span class="accent-letter">Deep</span>ProbLog result comes from the *same trained digit network* as before; nothing is retrained for three-digit addition. The CNN, on the other hand, has to treat the new task as a fresh 199-class classification problem. It does learn something — the loss falls from about 5.3 to 3, and accuracy rises from around 1% to 10% over thirty thousand iterations — but it does not generalise in the same way.

That is exactly what the symbolic part buys you. The network learns what digits look like; the program already knows how numbers and addition work.

### T3 and T4 — program sketches

T3 and T4 use the program-sketch setting from differentiable Forth (∂4): write most of an algorithm yourself, leave one small part unknown, and let a neural network learn that missing part from input/output examples of the whole program. The missing part is never supervised directly.

**T3 is addition.** The program is the usual grade-school algorithm: move from right to left, add two digits and the incoming carry, produce the result digit and the next carry. The learned part is that one local step.

**T4 is sorting.** The program is bubble sort, and the learned part is the only real decision bubble sort makes: given two values, swap them or not.

The paper's Table 1a is easy to misread because these are not single-number experiments. Each cell is a separate model trained on one input length and tested on a longer one. Sorting is trained on lengths 2 through 6, addition on lengths 2, 4 and 8, and both are tested on length 8 and length 64.

**Sorting (T4)**, accuracy %:

| System                                                    | Test length | train 2   | train 3   | train 4   | train 5   | train 6   |
| --------------------------------------------------------- | ----------- | --------- | --------- | --------- | --------- | --------- |
| ∂4 (paper)                                                | 8           | 100.0     | 100.0     | 49.2      | –         | –         |
| ∂4 (paper)                                                | 64          | 100.0     | 100.0     | 20.6      | –         | –         |
| <span class="accent-letter">Deep</span>ProbLog (paper)    | 8 / 64      | 100.0     | 100.0     | 100.0     | 100.0     | 100.0     |
| **<span class="accent-letter">Deep</span>ProbLog (mine)** | **8 / 64**  | **100.0** | **100.0** | **100.0** | **100.0** | **100.0** |

All ten cells reproduce exactly. The interesting part is the generalisation: ∂4 already breaks down when trained on length 4, while <span class="accent-letter">Deep</span>ProbLog trained on lists of length 6 can sort lists of length 64 perfectly. Once you look at what is actually being learned, this makes sense. Bubble sort itself is already in the program; the network only learns whether two items should be swapped, and a correct swap decision does not care how long the list is.

One detail for anyone rerunning this: the official sorting script uses a learning rate of 1.0, which never solved the task in three runs on my setup. A learning rate of 0.1 solved it in all three.

**Addition (T3)** came out at 100.0% in five of the six cells. The remaining one, train length 2 / test length 8, reached 97.7%; an earlier run with exactly the same setting reached 100.0%, so I would treat that as seed variation rather than a real difference.

The paper's **Table 1b** reports wall-clock time: how many seconds it takes to reach 100% accuracy on test length 8.

| System                                                           | train 2 | 3      | 4      | 5       | 6        |
| ---------------------------------------------------------------- | ------- | ------ | ------ | ------- | -------- |
| ∂4 on GPU (paper)                                                | 42      | 160    | –      | –       | –        |
| ∂4 on CPU (paper)                                                | 61      | 390    | –      | –       | –        |
| <span class="accent-letter">Deep</span>ProbLog on CPU (paper)    | 11      | 14     | 32     | 114     | 245      |
| **<span class="accent-letter">Deep</span>ProbLog on CPU (mine)** | **9**   | **19** | **41** | **139** | **1156** |

Four of the five numbers are within roughly 1.3× of the paper, which is closer than I expected after eight years of hardware and library changes. The last one is very different: 1,156 seconds instead of 245, about 4.7× slower. The machine was heavily loaded and this part of the workload is single-threaded CPU, so I would read the overall trend rather than too much into that one number.

### T5 — word algebra problems

The input is an English sentence describing a small math problem, and the output is the answer. Every problem contains three numbers and is solved through four decisions: choose an order for the numbers, choose an operation for the first two, decide whether to swap the intermediate result with the remaining number, and then choose the second operation. There are four holes in the program, one for each decision.

My best checkpoint reaches 97.5%, compared with the paper's reported 96–97%, so the main result reproduces well. But getting that number depends on one thing the paper does not really discuss: which checkpoint you keep.

| Checkpoint          | Test accuracy |
| ------------------- | ------------- |
| Best on the dev set | **97.5%**     |
| Final checkpoint    | 74.0%         |

That is a 23-point difference from the same training run.

![T5: training loss and dev accuracy against iterations](https://raw.githubusercontent.com/shaoweizhang1/DeepProbLog_Reproduction/main/deepproblog_demo/figs/t5.png)

Dev accuracy reaches 98% around iteration 570 and then moves between roughly 90% and 97% for another few hundred iterations. Around iteration 900, the training loss suddenly jumps from a few tenths to around 2–3 and never recovers, while dev accuracy falls with it. The final model is the one that scores 74.0% in the table.

Nothing in the data changed. The model found a good solution and then moved away from it. I come back to this below because the same thing shows up in T3, T4, T5 and T6.

### T6 — coin-ball

This experiment combines almost everything in the paper. There is a coin and two urns: the first contains red and blue balls, the second red, blue and green. Toss the coin, draw one ball from each urn, and you win if the two balls have the same colour, or if the coin is heads and at least one ball is red.

Three things are learned at the same time: one network reads an image of the coin and predicts heads or tails, another reads an RGB value and predicts a colour, and the program also learns ordinary probabilities for the coin bias and the colour ratios in the two urns. The only supervision is whether the final outcome is a win or a loss.

This is the one experiment I could not reproduce. The paper reports 100% test accuracy after five epochs on 256 training examples, with both networks correct and the learned probabilistic parameters matching the distribution used to generate the data. My reconstruction reaches 81.2% test accuracy, while the colour network reaches only 18.8%, below chance for three classes. Different runs move by several points, but none came close to 100%.

![T6: dev accuracy and training loss for the coin-ball reconstruction](https://raw.githubusercontent.com/shaoweizhang1/DeepProbLog_Reproduction/main/deepproblog_demo/figs/t6.png)

I want to be careful about what "could not reproduce" means here, because several important pieces of the original experiment are missing.

* **There is no released implementation of T6.** The closest example in the repository is a different task: two coins in one image, with no learnable probabilistic parameters. It cannot produce the result reported for T6, so I had to write the program, data generator and training loop from the paper's description.

* **Listing 6 does not run as printed.** The Pro<span class="accent-letter">b</span>Log program in the paper needs fixes before the library will accept it.

* **The original data is not available, and the missing part matters.** The paper describes the dataset in only a couple of sentences and never gives the actual urn ratios or coin bias used to generate it, even though recovering those values is one of the things the experiment is supposed to demonstrate.

I therefore had to choose my own distribution. If training recovers the values I chose, that shows that the mechanism can work, but it is not literally the same experiment the authors ran. What I report here is what my reconstruction of the description actually does, and the code and data generator are in the repository so the assumptions are at least explicit.

### Three things the paper does not mention

**Training can get worse after it gets good.** T3, T4, T5 and T6 all show the same pattern: training reaches a good solution, then sometimes moves away from it if I keep going. T5 is the clearest case, where the best checkpoint on the dev set gets 97.5% on the test set and the final checkpoint from the same run gets 74.0%.

This does not look like ordinary overfitting. What I see instead is probabilistic parameters moving toward 0 and 1. Once a parameter reaches zero, an entire branch of the program can effectively disappear, and if a neural network only receives gradient through that branch, its learning signal disappears too. Re-normalising an AD does not prevent this, because `(1, 0, 0)` is still a perfectly valid distribution. The plain neural baselines can be trained much longer without showing the same kind of collapse, so in my reproduction I select checkpoints on a dev set. That is standard practice, but here it matters a lot: on T5 it is the difference between 97.5% and 74.0%.

**It is mostly CPU-bound, and the GPU can make it slower.** A T1 iteration sends two tiny 28×28 images through a small CNN, which is cheap; most of the remaining work is grounding, compiling and evaluating the logic circuit on the CPU. Moving the neural networks to a GPU actually made my runs slower, partly because neural probabilities are repeatedly converted with `float(...)`, which brings values back to the CPU and forces device synchronisation. On networks this small, that overhead can cost more than the CNN itself. Even CPU parallelism can hurt: PyTorch's default intra-op threading adds enough overhead on these tiny tensors that using one thread was faster than using every core.

**Evaluation can cost more than training.** At test time, the answer is often left unbound, so the circuit has to represent every possible answer: 19 sums for T1 and 199 for T2. This makes a T2 evaluation query much more expensive than a T1 query even though the same digit network is underneath. If I had evaluated T2 as often as T1, I would have spent more time evaluating than training. Batching does not really solve this in the current setup either; as the paper notes, it uses gradient accumulation rather than true mini-batching.

### Small things

* **Figure 3 disagrees with itself.** The right-hand axis says *Accuracy*, while the caption calls it "F1 score on the test set". I logged both; the figures above show accuracy.

* **The official examples are not always the experiments from the paper.** Besides the T6 mismatch, the MNIST examples directory contains an `all_digit_addition` task where the *sum itself* is also represented by images. That is a reasonable extra task, but it is not T2, and assuming that it is eventually leads to an unknown-clause error.


## What I think, reading it

The nAD is the elegant part. With one new kind of declaration, Pro<span class="accent-letter">b</span>Log can use probabilities produced by a neural network and learn through them with gradient descent. Nothing else has to change: no new logic, no new inference algorithm, no softened version of conjunction. The network gives the existing machinery numbers it already knows how to reason with, and the same machinery can send gradients back. The connection is tiny, and the logic stays exact.

And it works. On T1, <span class="accent-letter">Deep</span>ProbLog passes 90% after about three thousand iterations and then mostly levels off, while the CNN baselines train for sixty thousand iterations and still finish lower: 96.6% against 85.9% and 75.4%. Same data, same budget, faster learning and a better result.

T2 surprised me more. Going from single digits to three-digit numbers changes two lines of the program and nothing in the network, yet the *same trained network* still works: 92.4%, while the CNN gets 13.0%. This is [compositionality](/reading-notes/building-machines-that-learn-and-think-like-people#the-core-ingredients-of-human-intelligence) in the sense Lake and co-authors mean it: build something new out of a small set of reusable parts. Here the reusable part is the digit classifier, and the program does the composing. I did not expect to see an idea from a cognitive science position paper show up this cleanly in a Prolog system with a two-layer CNN.

The mechanism is hidden in one sentence the paper almost throws away: the digit classifier "is not explicitly trained by itself: its output can be considered a latent representation, as we only use training data with pairwise sums of digits." The network never sees digit labels. Supervision is given only to the final sum, and the program carries that signal back down to the digits. A label on the whole becomes gradients on the parts. Most of what makes <span class="accent-letter">Deep</span>ProbLog interesting comes from that.

The paper is also very well written. The six experiments fall naturally into three groups, and each group asks a different question: can the system learn from supervision on the whole, can it replace a purpose-built differentiable interpreter, and can it combine perception, probability and logic in one model? By the end, you have a clear sense of what the system can and cannot do. That is rarer than it should be.

The costs are real, though. Most of the work is not in the neural network but in grounding, compiling and evaluating circuits, so the system is mostly CPU-bound. Approximate inference could make this cheaper by keeping only the most important proofs, but then the first thing you give up is the exact inference that makes the design so clean. Parallelism is also difficult: different queries can produce different circuits, so ordinary neural-network batching does not fit naturally. The paper itself notes that it uses gradient accumulation rather than true mini-batching. You can already see the practical ceiling in the scale of the experiments: MNIST addition, short sorting problems, 256 coin-ball examples. I suspect this scalability problem, more than the basic idea itself, is a big reason the approach did not become much more common.

The idea still deserves attention. It is worth reading in full in 2026, and worth asking how far the same interface — probabilities from a network, exact reasoning in the program, gradients back — could be pushed today.
