---
title: "DeepStochLog, Neural Stochastic Logic Programming"
date: "2026-10-07"
tags: ["problog", "deepstochlog", "neuro-symbolic"]
summary: "Building on context-free grammars cleverly makes the probabilistic choice at every derivation step, not once per world. This makes inference much faster, and it does well on six quite different tasks."
paper:
  title: "DeepStochLog: Neural Stochastic Logic Programming"
  authors: "Winters, T., Marra, G., Manhaeve, R., & De Raedt, L."
  year: 2022
  venue: "AAAI"
  url: "https://ojs.aaai.org/index.php/AAAI/article/view/21248"
---

Deep<span class="accent-letter">Stoch</span>Log starts from the problem my [Deep<span class="accent-letter">Prob</span>Log notes](/reading-notes/deepproblog-neural-probabilistic-logic-programming#what-i-think-reading-it) ended with: cost. Most of Deep<span class="accent-letter">Prob</span>Log's time goes into grounding, compiling and evaluating circuits, not into the network. The paper puts this down to the semantics. Deep<span class="accent-letter">Prob</span>Log defines a probability distribution over possible worlds, and inference over possible worlds is computationally hard. Two of the authors, Manhaeve and De Raedt, also wrote Deep<span class="accent-letter">Prob</span>Log.

There is another way to put probabilities into a logic program. In Pro<span class="accent-letter">b</span>Log and Deep<span class="accent-letter">Prob</span>Log, every probabilistic clause is a coin tossed once, before any query: the clause is either in the world or not, and a query's probability is the total probability of the worlds where it holds. A stochastic grammar instead makes a new choice at every step of a derivation, and a query's probability is the total probability of the derivations that produce it. The paper calls this "a random graph vs a random walk model", and notes that neuro-symbolic work had so far almost always taken the first. Deep<span class="accent-letter">Stoch</span>Log takes the second. It is a stochastic definite clause grammar whose rule probabilities can come from a neural network.

On four-digit MNIST addition, the paper's Table 7 has Deep<span class="accent-letter">Prob</span>Log timing out, while Deep<span class="accent-letter">Stoch</span>Log needs a few milliseconds per query. The accuracy does not suffer for it. On the tasks with images, Deep<span class="accent-letter">Stoch</span>Log matches or beats Deep<span class="accent-letter">Prob</span>Log and the other neuro-symbolic systems. On citation networks, where Deep<span class="accent-letter">Prob</span>Log times out, it beats most of the methods built for that task, though not the two best.

This post first goes through the grammar notation, which was new to me, then compares the two systems, and then reports my reproduction. The accuracy matches the paper. But one timing table cannot be produced with the released code, and the T2 model described in the paper is not the one in the code.

## From CFG to DeepStochLog

The paper starts from context-free grammars (CFGs), a concept from linguistics that goes back to Chomsky, then goes through PCFGs, DCGs and SDCGs, and lastly adds neural networks. I had never come across CFGs before reading this paper, so it took me a long time to read and understand, and this section is therefore long. If you already know these grammars, you can skip ahead to [Derivations and probabilities](#derivations-and-probabilities).

### From CFG to SDCG

#### Context-Free Grammar

Context-free Grammar (CFG): $G=(V,\Sigma,S,R)$

$V$ is the set of non-terminals, $\Sigma$ is the set of terminals.
$S \in V$ is the starting symbol, $R$ is a set of rewrite rules of the form $N \rightarrow M_1,\ldots,M_k$ where $N$ is a non-terminal, the $M_i$ are either terminals or non-terminals.

This definition was too abstract for me, so here is an example.

When God decides to create cats:

- $V$, non-terminals: the parts of the cat's Idea, $\{Cat, Body, Soul, Habit\}$

- $\Sigma$, terminals: what materials we really need for a real cat, [four legs], [a tail], [two eyes], [two ears], [mammal], and some habits

- $S$, starting symbol: Cat, which is in $V$

- $R$, rules for creating a cat:

<div class="code-compare">
<div>
<p class="code-compare-label">Example 1 · A CFG for making a cat</p>

```problog
Cat   → Body, Soul
Body  → [four legs], [a tail], [two eyes], [two ears], [mammal]
Soul  → Habit, Habit, Habit
Habit → [likes to eat]
Habit → [sleeps sixteen hours a day]
Habit → [starts zooming and screeching around 3am]
Habit → [nudges your stuff off the table edge while maintaining eye contact]
```

</div>
</div>

So this is a CFG that describes how God makes a cat. Making a cat starts from an idea and the rules, then materials should be going from non-terminals to terminals according to the rules to form a cat.

#### Probabilistic Context-Free Grammar

A probabilistic context-free grammar (PCFG) extends a CFG by adding probabilities to the rules $R$. So $R$ for a PCFG looks like:

<div class="code-compare">
<div>
<p class="code-compare-label">Example 2 · The same grammar with probabilities</p>

```problog
1.0 :: Cat   → Body, Soul
1.0 :: Body  → [four legs], [a tail], [two eyes], [two ears], [mammal]
1.0 :: Soul  → Habit, Habit, Habit

0.3 :: Habit → [likes to eat]
0.3 :: Habit → [sleeps sixteen hours a day]
0.2 :: Habit → [starts zooming and screeching around 3am]
0.2 :: Habit → [nudges your stuff off the table edge while maintaining eye contact]
```

</div>
</div>

The sum of the probabilities of rules with the same non-terminal on the left-hand side equals 1.

#### Definite Clause Grammar

Definite clause grammars (DCGs) extend CFGs with logic programming. They use logical atoms instead of non-terminals. An atom $a(t_1,\ldots,t_n)$ is a predicate $a$ of arity $n$ applied to $n$ terms, and a term can be a constant, a logical variable, or a structured term $f(t_1,\ldots,t_k)$ with $f$ a functor. Each DCG rule is a definite clause (a Horn clause with exactly one positive literal), so the grammar runs as a Prolog program.

Which rule is used next is decided by **unification**, which matches the goal atom to a rule head position by position. A constant only matches the same constant, and a variable matches anything and binds to it. The bindings are the substitutions $\theta$: matching `soul(2)` against `soul(N)` gives $\theta = \{N/2\}$.

<div class="code-compare">
<div>
<p class="code-compare-label">Example 3 · The cat grammar as a DCG</p>

```problog
cat(N)  → body, soul(N)
body    → [four legs], [a tail], [two eyes], [two ears], [mammal]
soul(0) → []
soul(N) → habit, {N1 is N-1}, soul(N1)
habit   → [likes to eat]
habit   → [sleeps sixteen hours a day]
habit   → [starts zooming and screeching around 3am]
habit   → [nudges your stuff off the table edge while maintaining eye contact]
```

</div>
</div>

With logical atoms, making a cat becomes more natural, and a cat can finally have a variable number of habits. But how do we control the probability of each habit when a cat is made?

#### Stochastic Definite Clause Grammar

Stochastic definite clause grammars (SDCGs) extend DCGs by attaching a probability to each rule. The probabilities of rules with the same head predicate sum to 1, as in a PCFG.

The cat example becomes:

<div class="code-compare">
<div>
<p class="code-compare-label">Example 4 · The DCG with probabilities</p>

```problog
1.0 :: cat(N)  → body, soul(N)
1.0 :: body    → [four legs], [a tail], [two eyes], [two ears], [mammal]
0.2 :: soul(0) → []
0.8 :: soul(N) → habit, {N1 is N-1}, soul(N1)
0.3 :: habit   → [likes to eat]
0.3 :: habit   → [sleeps sixteen hours a day]
0.2 :: habit   → [starts zooming and screeching around 3am]
0.2 :: habit   → [nudges your stuff off the table edge while maintaining eye contact]
```

</div>
</div>

### Derivations and Probabilities

A derivation starts from a goal and rewrites it, step by step, until only terminals are left. Every step is the same move: take the leftmost atom, find a rule whose head matches it, and replace that atom with the rule's body.

Take the goal `soul(1)`, the soul of a cat with one habit to fill:

```
soul(1)
habit, {N1 is 1-1}, soul(N1)
[likes to eat], {N1 is 1-1}, soul(N1)
[likes to eat], soul(0)
[likes to eat]
```

Two variables get a value here, and they get it in two different ways.

The first step matches `soul(1)` against the head `soul(N)`. `N` is a variable and `1` is a constant, so `N` becomes `1`. That is unification: it lines the two up position by position and binds the variable to what it finds. The same substitution goes onto the rest of the rule body, which is why the rule's `{N1 is N-1}` shows up here as `{N1 is 1-1}`.

`N1` is the other case. It appears for the first time inside that guard, and nothing in the goal says what it is. There is nothing to match it against, so unification cannot help. The guard computes instead: `1-1` is `0`, `N1` becomes `0`, and `soul(N1)` becomes `soul(0)`. Running the guard removes it, which is why the next line has no `{N1 is 1-1}` in it. The next step takes the other soul rule, `soul(0) → []`, and the goal loses its last atom. What is left is one terminal, `[likes to eat]`.

So a variable gets a value in one of two ways. Unification copies a value that is already there. The `{...}` guard works one out.

The probability of a derivation is the product of the rules it used, each raised to how many times it was used: $P(d(G)) = \prod p_i^{m_i}$. The derivation above uses three rules, each once: $0.8 \times 0.3 \times 0.2$.

Here SDCG differs from PCFG. Every non-terminal in a PCFG has a rule to expand, so a derivation always goes through. An SDCG derivation can fail, and its mass is lost. This happens in two ways:

- Unify failure. An atom unifies with no rule head. Further down, a network produces `fur(black)`, `fur(orange)` and `fur(white)`; `fur(purple)` matches none of them. A PCFG has no counterpart: its non-terminals carry no arguments, so nothing can fall outside their range.

- Non-terminating. A rule expands back into itself, forever. `soul(-1)` keeps matching `soul(N) → habit, {N1 is N-1}, soul(N1)`: `soul(-2)`, `soul(-3)`, never reaching `soul(0)`.

The probability of a terminal string $T$ is a sum, not a max: $P(derives(G,T)) = \sum_d P(d(G))$, over every derivation that yields $T$. Sum, because one $T$ can have several parses. The cat grammar is unambiguous, so the sum here has one term — that is not always true.

Failing derivations make the total less than 1, so true probabilities would need a normalization constant $Z$. The paper skips it for two reasons: $Z$ is expensive to compute, and the goal is often the most likely derivation, the argmax, for which a constant factor makes no difference. Its conclusion still lists the lost probability mass as a limitation.

### Neural Rules and DeepStochLog

Every rule so far carried a number written by hand. `0.3 :: habit → [likes to eat]` says a cat likes to eat with probability 0.3, and it says so for every cat.

Deep<span class="accent-letter">Stoch</span>Log lets that number come from a neural network instead. Give the network an image or a text, and it returns a distribution over what that input is. The distribution becomes the rule's probability, so the number changes from cat to cat.

Deep<span class="accent-letter">Prob</span>Log does the same thing with its neural predicates. The visible difference is where the number lands, on a rule rather than on a fact; the comparison with Deep<span class="accent-letter">Prob</span>Log further down explains why the difference goes deeper. Written down, it looks like this:

```
nn(net, [I_1,...,I_k], [O_1,...,O_L], [D_1,...,D_L]) :: nt → g_1,...,g_n
```

$I_1,\ldots,I_k$ are the network's inputs, $O_1,\ldots,O_L$ its outputs, and each $D_i$ is the domain $O_i$ ranges over. The rule is a template: $\sigma$ fixes the input variables, $\theta_j$ picks one value for each output variable, and every combination becomes an ordinary rule $p_j :: (\mathit{nt} \rightarrow g_1,\ldots,g_n)\sigma\theta_j$.

The cat version. God does not write down the fur color; he looks at a photo:

```
nn(catnet, [Photo], [Color], [color]) :: fur(Color) → [Photo]
```

`color` is `color(black)`, `color(orange)`, `color(white)`. For `Photo` = an orange cat, `catnet` returns:

```
0.7 :: fur(orange) → [orange cat photo]
0.2 :: fur(black)  → [orange cat photo]
0.1 :: fur(white)  → [orange cat photo]
```

Note that it is conditional: $P(\mathit{color} \mid \mathit{photo})$. The photo's own probability is never modeled, and that is what a parser wants. The input is given; only the distribution over labels on top of it is learned.

## Inference and training

### Inference

Inference has to compute $P(derives(G,T))$. Deep<span class="accent-letter">Stoch</span>Log does this in two steps, first a logical one and then a probabilistic one.

Logical inference runs resolution to find every derivation from $G$ to $T$, and turns them into an AND-OR circuit. One resolution step adds an AND node. A normal rule contributes its $p_i$; a neural rule contributes a probability the network computes. Where the SLD tree branches (one goal, several rules), an OR node is added. Leaves are probability parameters or network outputs. So all the derivations end up in one circuit.

Naive SLD proves the same intermediate goal over and over, and redoes all the work under it every time. SLG resolution avoids this with tabling: once a goal is proved, its answers are stored in a table and reused the next time the goal comes up. This is the same job CYK dynamic programming does for CFGs. The derivations then share their subtrees instead of each keeping its own copy.

Probabilistic inference evaluates the circuit bottom-up. AND nodes multiply, OR nodes add, so the logical circuit becomes an arithmetic circuit over the $(+,\times)$ semiring. For the most probable derivation, replace $+$ with $\max$, the $(\max,\times)$ semiring.

The two formulas for probability above are the same two operations. $P(d(G))$ is the product inside one derivation, which is the AND. $P(derives(G,T))$ is the sum across derivations, which is the OR. So the circuit is built once, and evaluating it with multiplication at the AND nodes and addition at the OR nodes gives the query's probability.


### Training

Training optimizes the rule probabilities $p$.

The data is a set of triples $(G_i\theta_i, T_i, t_i)$: a goal grounded by a substitution $\theta_i$, the terminal sequence it should derive, and a target probability. The optimization is $\min_p \sum_i L(P(derives(G_i\theta_i,T_i);p), t_i)$, with $L$ any differentiable loss.

The arithmetic circuit is differentiable, so the gradient of the loss with respect to $p$ comes out of any automatic-differentiation framework. When $p$ is produced by a network (a neural rule), the gradient flows back into the network and trains it too. From there it is ordinary gradient descent with Adam.

When $L$ is the negative log-likelihood, this connects to how probabilistic grammars are classically learned, by EM: an inside algorithm and an outside algorithm give the expected count of each rule (E-step), and those counts are renormalized into new probabilities (M-step). The outside algorithm has to be derived anew for each grammar formalism. In Deep<span class="accent-letter">Stoch</span>Log the backward pass through the AND-OR circuit already computes the outside probabilities, so the E-step comes for free. The update is a gradient step instead of renormalized counts. The paper calls this equivalent to EM, but strictly only the E-step is the same.

## DeepStochLog against DeepProbLog

Both systems build an AND-OR circuit over every way of proving a query, then read the query's probability off it and backpropagate into the networks. The two differ in what the probabilities describe.

<div class="code-compare">
<div>
<p class="code-compare-label">Deep<span class="accent-letter">Prob</span>Log</p>

```problog
nn(m_digit, X, [0,...,9]) :: digit(X,0); ... ; digit(X,9).
addition(X,Y,Z) :- digit(X,X2), digit(Y,Y2), Z is X2+Y2.
```

</div>
<div>
<p class="code-compare-label">Deep<span class="accent-letter">Stoch</span>Log</p>

```problog
nn(number, [X], [Y], [digit]) :: number(Y) → [X].
addition(N) → number(N1), number(N2), {N is N1+N2}.
```

</div>
</div>

In Deep<span class="accent-letter">Prob</span>Log, the probability belongs to the fact `digit(a,3)`: image `a` is a 3, with a probability the network chooses. In Deep<span class="accent-letter">Stoch</span>Log it belongs to the rule `number(3) → [a]`. There the network decides how image `a` is read. But Pro<span class="accent-letter">b</span>Log can put a number on a rule as well — my [Pro<span class="accent-letter">b</span>Log notes](/reading-notes/problog-a-probabilistic-prolog) have `0.8::likes(X,Y) :- ...`. So a probability on a rule is not unique to Deep<span class="accent-letter">Stoch</span>Log. What separates the two systems is when the probabilistic choice is made.

Deep<span class="accent-letter">Prob</span>Log decides once, before the query. Every probabilistic clause is either in the world or not, and that is fixed. A query's probability is then the total probability of the worlds where it holds.

Deep<span class="accent-letter">Stoch</span>Log decides again at every step. Rules with the same head are alternatives whose probabilities sum to 1, and one of them is picked each time a goal is expanded. So a query's probability is the total probability of the derivations that produce it.

For MNIST addition the two give the same number. There are nine ways to add two single digits and get 8, and those are nine worlds on one side and nine derivations on the other. The two part company when the same uncertain thing is used twice:

<div class="code-compare">
<div>
<p class="code-compare-label">Deep<span class="accent-letter">Prob</span>Log</p>

```problog
0.5::rain.
wet_twice :- rain, rain.
```

</div>
<div>
<p class="code-compare-label">Deep<span class="accent-letter">Stoch</span>Log</p>

```problog
0.5 :: weather(rain) → [].
0.5 :: weather(dry)  → [].
wet_twice → weather(rain), weather(rain).
```

</div>
</div>

Deep<span class="accent-letter">Prob</span>Log decides `rain` once, so `wet_twice` holds exactly in the worlds where it rains and $P(\mathit{wet\_twice}) = 0.5$. Deep<span class="accent-letter">Stoch</span>Log chooses at each use, so the two uses are independent and $P(\mathit{wet\_twice}) = 0.5 \times 0.5 = 0.25$.

The timing also decides how the probabilities combine, and that is what makes inference fast. In Deep<span class="accent-letter">Prob</span>Log two proofs can hold in the same world. Take an umbrella when it rains or when it is cloudy, and a day that is both gives two proofs of the same conclusion. Adding their probabilities would count that day twice, so a query cannot be answered by adding its proofs up. That is why a query is compiled into a circuit that keeps the proofs from covering the same world. This is the [second trick](/reading-notes/problog-a-probabilistic-prolog#trick-2--trade-a-formula-for-a-diagram) in my Pro<span class="accent-letter">b</span>Log notes. Two Deep<span class="accent-letter">Stoch</span>Log derivations differ in at least one choice, so they never both happen and their probabilities add directly. With tabling, inference is then ordinary dynamic programming.

In return, an uncertain fact that several rules should share cannot be written down: each use of `weather(rain)` is a separate choice, so two rules cannot be made to agree on it. And a derivation that fails a later check loses its probability. T2 divides, and a division by zero drops that derivation, so the probabilities of the rest can sum to less than 1.

## Experiments and Reproduction

The paper has six tasks:

- **T1, MNIST addition.** Two numbers, each written as N handwritten MNIST digits, labelled only with their sum. N goes from 1 to 4.

- **T2, handwritten formulas.** A formula like `7 * 2 - 3`, where every digit and operator is a handwritten image, labelled only with its value. Lengths 1, 3, 5 and 7.

- **T3, well-formed parentheses.** MNIST zeros stand for "(" and ones for ")". The model has to find the most probable parse of a well-formed sequence.

- **T4, $a^n b^n c^n$.** Sequences of MNIST images standing for a, b and c. The model decides whether a sequence has this form (the three blocks may be permuted) or is a negative example.

- **T5, citation networks.** Classify scientific papers in Citeseer and Cora from their words and from the papers they cite, with labels for only a small training set.

- **T6, word algebra problems.** A short text with three numbers, such as "Mark has 6 apples. He eats 2 and divides the remaining among his 2 friends. How many apples did each friend get?", labelled with the answer.

T5 and T6 use empty productions, so they are written as general logic programs rather than grammars. That is how the paper shows that Deep<span class="accent-letter">Stoch</span>Log is a full stochastic logic programming system and not just a parser.

Besides, two timing tables: the paper's Table 6 measures parsing with and without tabling on T2, and the paper's Table 7 measures inference per query on T1.

I reproduced all of it using the official [implementation](https://github.com/ML-KULeuven/deepstochlog) at a fixed commit, with a small patch so it runs on current Python and pandas. The code is on [GitHub](https://github.com/shaoweizhang1/reproduction/tree/main/deepstochlog).

The accuracy numbers match the paper. Everything after this is about what did not: one of the two timing tables cannot be produced with the released code, the T2 model described in the paper is not the one in the code, and three experiments needed changes before they would finish in a reasonable time.

### Accuracy matches the paper

| Task | Setting  | Mine        | Paper       |
| ---- | -------- | ----------- | ----------- |
| T1   | 1 digit  | 98.0 ± 0.1  | 97.9 ± 0.1  |
|      | 2 digits | 96.1 ± 0.3  | 96.4 ± 0.1  |
|      | 3 digits | 94.7 ± 0.4  | 94.5 ± 1.1  |
|      | 4 digits | 92.8 ± 0.5  | 92.7 ± 0.6  |
| T2   | length 1 | 89.1 ± 1.0  | 90.8 ± 1.0  |
|      | length 3 | 85.5 ± 1.7  | 86.3 ± 1.9  |
|      | length 5 | 90.7 ± 1.1  | 92.1 ± 1.4  |
|      | length 7 | 94.5 ± 0.6  | 94.8 ± 0.9  |
| T3   | max 10   | 100.0 ± 0.0 | 100.0 ± 0.0 |
|      | max 14   | 99.6 ± 0.5  | 100.0 ± 0.0 |
|      | max 18   | 99.6 ± 0.5  | 100.0 ± 0.0 |
| T4   | 3–12     | 99.3 ± 0.3  | 99.4 ± 0.5  |
|      | 3–15     | 99.2 ± 0.6  | 99.2 ± 0.4  |
|      | 3–18     | 99.1 ± 0.2  | 98.8 ± 0.2  |
| T5   | Citeseer | 64.5 ± 1.9  | 65.0        |
|      | Cora     | 72.4 ± 0.4  | 69.4        |
| T6   | WAP      | 94.4 ± 0.5  | 94.8 ± 1.1  |

Test accuracy in %, mean ± standard deviation over five runs. Apart from Cora, every cell is within 1.7 points of the paper. T1 here uses a faster evaluator and T2 runs on CPU; both are explained below, and neither changes what is computed.

**Reruns are not exact.** The same T2 seed on the same CPU gives different results from run to run: at length 1, seed 0 gave between 87.5% and 90.0% over six runs. Fixing Python's hash seed does not change this.

T5 needed one guess: the citation program unrolls the citation graph to a fixed depth, and the paper does not say which depth. I used 2. Cora then comes out about 3 points above the paper, 72.4% against 69.4%. I do not think that matters much, and I did not look into why.

### Table 6 and the tabling switch

The paper's Table 6 is the experiment behind the tabling switch. It takes T2 formulas with placeholder symbols instead of images, and enumerates every possible parse: 10 answers at length 1, 1,066 at length 5, 416,517 at length 11. It times this twice, once with plain SLD resolution and once with tabling (SLG).

The released code cannot run the SLD half. The tree builder in release 0.0.1 has a `tabling=False` option, but it never removes the `:- table solve/1.` declaration from the generated program, so both modes are tabled. The release has three more problems: the grammar uses a two-argument `nn` fact that the helper code does not define, so even length 1 returns zero answers; one declaration is included many times, which in SLD multiplies the proof paths; and the answer printing keeps backtracking state alive, which makes long outputs much slower. With a 16 MB stack, the released SLD mode stopped at length 5 with a stack-limit error.

So I rebuilt the SLD mode. Both modes get the same three repairs, and SLD alone drops the table declaration and the branch that only fills tables. Before each run, SWI-Prolog checks that `solve/1` really is tabled or really is not. Every completed run produced the right number of answers, and at lengths 1, 3 and 5 the answer sets were compared with a plain Prolog DCG and matched.

| Length | Answers | SLD, mine (s) | SLD, paper (s) | SLG, mine (s) | SLG, paper (s) |
| ------ | ------- | ------------- | -------------- | ------------- | -------------- |
| 1      | 10      | 0.191         | 0.067          | 0.179         | 0.060          |
| 3      | 95      | 0.223         | 0.081          | 0.212         | 0.096          |
| 5      | 1,066   | 2.110         | 3.78           | 0.646         | 0.95           |
| 7      | 10,386  | 79.853        | 30.42          | 5.624         | 10.95          |
| 9      | 68,298  | 3,306.359     | 1,494.23       | 61.487        | 132.26         |
| 11     | 416,517 | timeout       | timeout        | 573.647       | 1,996.09       |

Mean of three runs, one hour limit per run. SLD at length 11 timed out all three times, as it did for the paper.

Tabling helps in my runs too, and more than in the paper's. At length 9, SLG is 54 times faster than SLD for me (3,306 s against 61.5 s) and 11 times faster in the paper (1,494 s against 132 s). From length 7 on, the absolute times move in opposite directions: my SLG is about twice as fast as the paper's, and my SLD about twice as slow. A different machine (a server CPU here, a 2020 MacBook Pro in the paper) cannot explain both. My repairs change what each mode does, and the authors' own timing scripts were not released, so I cannot say which column is closer to what they ran.

The paper's tabling comparison depends on a switch that does nothing in the released code.

### Inference time per query

The paper's Table 7 times the probability of one T1 query after its proofs are built, for Deep<span class="accent-letter">Stoch</span>Log and its competitors. For Deep<span class="accent-letter">Prob</span>Log the paper reports 199.7 ms at 3 digits and a timeout at 4. I only reran the Deep<span class="accent-letter">Stoch</span>Log row, 100 training queries per run, five runs per length, on one CPU thread.

| Digits per number | Mine (ms)     | Paper (ms) |
| ----------------- | ------------- | ---------- |
| 1                 | 1.209 ± 0.184 | 1.3 ± 0.9  |
| 2                 | 2.130 ± 0.282 | 2.3 ± 0.4  |
| 3                 | 3.582 ± 0.453 | 4.0 ± 0.4  |
| 4                 | 9.259 ± 2.663 | 5.7 ± 1.8  |

The released timing script needed two fixes: it queried `addition` while the grammar defines `multi_addition`, and its loop stopped after 99 queries instead of 100. Lengths 1 to 3 are close to the paper. Length 4 is slower and noisier: one run averaged 4.6 ms and the other four between 9.8 and 11.2 ms. The spread inside each of those runs points to a few very slow queries. The script only reports a mean and a standard deviation, so I cannot tell which queries those were. Even 9.3 ms is far below Deep<span class="accent-letter">Prob</span>Log.

### Paper and code disagree

The paper's appendix describes T2 with two separate networks, one for digits and one for operators. It also lets two small networks decide which rule to use: whether a term is a single number or a product or quotient, and whether an expression is a single term or a sum or difference. The released code does neither. Digits and operators share one encoder, and the rule choice is fixed at 0.34/0.33/0.33.

The shared encoder also has a bug. Its parameters reach the optimizer twice, once through each network, so Adam updates them twice per step. PyTorch warns about it in the T2 logs ("optimizer contains a parameter group with duplicate parameters").

My runs of the released code match the paper's Table 2, so the paper's numbers almost certainly come from the code and not from the model in the appendix. To see what the appendix model does, I built it: two separate encoders, and the rule choices as learned distributions over the three rules. The grammar is copied from the appendix. Both models ran on CPU with seeds 0 to 4.

| Length | Released code | Paper's model                    |
| ------ | ------------- | -------------------------------- |
| 1      | 89.1 ± 1.0    | 91.2 ± 1.2                       |
| 3      | 85.5 ± 1.7    | 83.6 ± 3.2                       |
| 5      | 90.7 ± 1.1    | 91.9 ± 0.8 (four runs), one 1.25 |
| 7      | 94.5 ± 0.6    | 1.3 ± 0.1                        |

At length 1 the paper's model is about 2 points better. At length 3 it is about 2 points worse and twice as variable. At length 5, four runs are fine and one never learned anything: 1.25%. Rerunning that seed gave 41.75%, which is better but still stuck. At length 7 all five runs failed. The loss stayed around 8 for twenty epochs and test accuracy stayed near 1.3%, while the released code (seed 0) passed 90% within three epochs.

Two caveats. The appendix does not say how the rule choices are initialised or whether they get their own learning rate; I started them uniform and trained them with the same Adam as everything else. And I changed two things at once, so I cannot say which one breaks training. My guess is the learned rule choices. They are only a few free numbers, and Adam can move them quickly. If they settle on a wrong way of parsing early on, the correct answer gets almost no probability, and the digit network never receives a useful signal. Longer formulas have more places for this to go wrong. That is a guess, not something I tested.

Two smaller disagreements, in the text rather than the code:

- **The metrics differ from the paper's text.** The paper says T1 to T3 report the accuracy of the most probable parse. In the code, T1 checks the predicted sum, T2 reads each symbol greedily and evaluates the formula, and only T3 scores parses.

- **T1's rule weights differ, harmlessly.** The appendix gives the two `multi_addition` rules probability 0.5, the code 1. For a fixed length every derivation uses the same number of these rules, so all candidates are scaled by the same constant and nothing changes.

### Making it run

I sped up three experiments, and none of the changes affects what is computed. For T1 it was necessary: without it, the longer lengths would not finish.

**T1 evaluation.** To score one example, the released evaluator computes the probability of every possible sum through the proof trees. That is 19 sums for one-digit numbers and 19,999 for four-digit numbers. I replaced only this step. The new evaluator combines the network's digit probabilities directly, carrying from the last digit to the first, and gets the same distribution exactly. Training and proving are unchanged. One epoch at each length:

| Digits per number | Original (s) | New evaluator (s) | Speedup |
| ----------------- | ------------ | ----------------- | ------- |
| 1                 | 269          | 54                | 5×      |
| 2                 | 7,081        | 77                | 92×     |
| 3                 | > 21,600     | 94                | > 220×  |
| 4                 | > 21,600     | 104               | > 200×  |

At lengths 3 and 4 the original evaluator did not finish one epoch in six hours. The original and new runs were on different machines, so the speedups are rough. At length 1, where all three variants could finish 25 epochs five times, they reach the same accuracy: 98.14% with the original evaluator, 98.02% with it spread over 16 processes, and 97.98% with the new one. Without the new evaluator, length 2 alone would take roughly ten days.

**T5 evaluation.** Validation and test documents are scored one at a time, and every document is independent of the others. Spread over 16 processes, the first epoch drops from 23.9 s to 4.9 s on Citeseer and from 59.8 s to 8.9 s on Cora, with the same accuracies.

**T2 on CPU.** Here the cost is training itself, and almost none of it is the networks. Most of the time goes to evaluating and backpropagating through large proof trees, and every node is a separate operation on a single number. A GPU is built for large operations, and on one number the cost of launching each operation is larger than the operation. So T2 runs faster on CPU:

| Length | GPU, per seed (s) | CPU, per seed (s) | Speedup |
| ------ | ----------------- | ----------------- | ------- |
| 1      | 40                | 40                | 1.0×    |
| 3      | 154               | 121               | 1.3×    |
| 5      | 1,441             | 739               | 2.0×    |
| 7      | 40,395            | 16,527            | 2.4×    |

On CPU the five seeds can also run side by side, which takes length 7 from about 56 hours to under 5. This is the same thing I found with Deep<span class="accent-letter">Prob</span>Log: the system is CPU-bound, and the GPU can make it slower. Deep<span class="accent-letter">Stoch</span>Log needs far less work per query than Deep<span class="accent-letter">Prob</span>Log, but it computes that work in the same way, one node at a time.

## What I think, reading it

This paper took me a long time. Compared with Pro<span class="accent-letter">b</span>Log and Deep<span class="accent-letter">Prob</span>Log, the new part of the method is the grammar, which I had never seen before. I now think a grammar is a very good representation for this kind of problem. It describes how an answer is built up from its parts, one rule at a time, and every way of building it gets a probability. That is the direction Deep<span class="accent-letter">Stoch</span>Log takes: away from facts that are simply true or false, towards probabilities over the ways an answer can be put together.

The paper is good at saying what it is for. The first page explains that there are two ways to put probabilities into logic programs, possible worlds and stochastic grammars, or in the paper's words "a random graph vs a random walk model", and that neuro-symbolic work had almost always used the first. The method section is short and clear: there is one new construct, the neural rule, explained as a template with an MNIST example. My favourite part is the one on training. Backpropagation through the circuit computes the outside probabilities, the E-step of EM, so no outside algorithm has to be derived by hand. The conclusion is honest about its limits too: no structure learning, lost probability mass, and inference that could be parallelised.

The weaker part is everything around the method. The background on grammars takes a few paragraphs, which is fine if you already know PCFGs and hard if you do not. The numbering is confusing: tasks T1 to T6, Tables 1 to 7 and questions Q1 to Q4 do not line up, and in the arXiv version the paper's Table 6 is labelled Q4 although tabling belongs to Q2 in the paper's own list of questions.

Deciding probabilities per derivation instead of per world is the paper's main choice, and it is what makes tabling and the speed possible. For sequences and formulas I think this is a good trade. It is a worse one for a fact that several parts of a program have to agree on, and the paper does not dwell on that cost. I am also only half convinced by the explanation of the speed. The paper gives two reasons, tabling and the cheaper random-walk semantics, but it only measures the first, and against Deep<span class="accent-letter">Prob</span>Log both change at once. The implementation also keeps Deep<span class="accent-letter">Prob</span>Log's limit: each query needs much less work, but the work is still done one node at a time.

Reproducing it took much longer than the two earlier papers, and the released code does not always match the text. The details are in the reproduction above. The one I would remember is that my implementation of the paper's own T2 model did not fit at length 7 in any of five runs.

Putting the neural network on a grammar rule is a small change with a large effect on cost, and I think the idea is brilliant. But the paper was published at AAAI 2022: GPT-2 and GPT-3 already existed, and ChatGPT came out later that year. Next to that, the largest example here is a citation graph of about 3,000 papers. I would like to see neuro-symbolic systems that can represent much more than this. And I would like languages like Deep<span class="accent-letter">Stoch</span>Log to scale, which today means running efficiently on modern hardware: batched, and on a GPU.
