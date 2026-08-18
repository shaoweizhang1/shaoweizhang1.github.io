---
title: "ProbLog, a Probabilistic Prolog"
date: "2026-08-07"
tags: ["logic-programming", "problog"]
summary: "A classic of probabilistic logic programming, still full of ideas twenty years on. The writing is precise and unhurried — it reads like a well-built textbook chapter, hard to read but worth the time."
paper:
  title: "ProbLog: A Probabilistic Prolog and its Application in Link Discovery"
  authors: "De Raedt, L., Kimmig, A., & Toivonen, H."
  year: 2007
  venue: "IJCAI"
  url: "https://dl.acm.org/doi/10.5555/1625275.1625673"
---

Prolog is a programming language for formal-logic inference: given a set of facts and rules, it decides whether some hypothesis holds. Pro<span class="accent-letter">b</span>Log is built directly on top of that same inference engine — it brings a probability to every rule, turning that binary yes/no judgment of Prolog into "how likely is this to hold." This paper is about how Pro<span class="accent-letter">b</span>Log defines that probabilistic semantics, and how it makes the probability actually computable.

## Same syntax, one extra number

The paper's example (Example 1), written in different ways — the Pro<span class="accent-letter">b</span>Log version is exactly the Prolog version with a probability prefixed to every clause:

<div class="code-compare">
<div>
<p class="code-compare-label">Prolog</p>
<pre><code>likes(X,Y) :- friendof(X,Y).
likes(X,Y) :- friendof(X,Z), likes(Z,Y).

friendof(john,mary).
friendof(mary,pedro).
friendof(mary,tom).
friendof(pedro,tom).</code></pre>
</div>
<div>
<p class="code-compare-label">Pro<span class="accent-letter">b</span>Log</p>
<pre><code>1.0::likes(X,Y) :- friendof(X,Y).
0.8::likes(X,Y) :- friendof(X,Z), likes(Z,Y).

0.5::friendof(john,mary).
0.5::friendof(mary,pedro).
0.5::friendof(mary,tom).
0.5::friendof(pedro,tom).</code></pre>
</div>
</div>

That one probability per clause is enough to define everything. A program $T = \{p_1:c_1, \cdots, p_n:c_n\}$ treats each clause as an independent coin flip, so any specific subset $L$ of clauses — a *possible world* — has probability

$$
P(L|T) = \prod_{c_i \in L} p_i \prod_{c_i \in L_T \setminus L} (1-p_i)
$$

Inside one fixed world, a query's truth is the ordinary binary kind according to plain Prolog:

$$
P(q|L) = \begin{cases} 1 & \exists \theta : L \models q\theta \\ 0 & \text{otherwise} \end{cases}
$$

$$
P(q,L|T) = P(q|L) \cdot P(L|T)
$$

$$
P(q|T) = \sum_{M\subseteq L_T} P(q,M|T)
$$

The second equation is Prolog running inside one fixed world; the first says how likely that world is; the last two just add it up over every world. That's the entire semantics of Pro<span class="accent-letter">b</span>Log — four short equations, no more hidden secrets. The point is in that last sum: it ranges over every one of the $2^n$ possible worlds, and nothing about the definition tells you how to compute it without actually visiting all of them.

## Three tricks that make it computable

This is the most valuable part of the paper. The last equation above says compute $P(q|T)$ by summing over every subset of $L_T$ — but that's $2^n$ subsets, and no program in real world has a small $n$. The rest of the paper is three tricks, each giving up something (an exact enumeration, a direct formula, an exact answer) for something computable back. We can walk through slowly on `likes(john,tom)`, since every piece of it is something we are familiar with.

### Trick 1 — trade worlds for proofs

Instead of asking "which of the $2^n$ subsets of clauses make $q$ true," ask a smaller question: "how did SLD-resolution actually prove $q$?" Run the ordinary, non-probabilistic SLD-tree for `likes(john,tom)` and look at what comes out:

<figure class="paper-diagram">
<svg viewBox="0 0 620 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SLD-tree for the query likes(john,tom): one branch fails immediately by trying friendof(john,tom) directly, a second branch succeeds via friendof(mary,tom), a third succeeds via friendof(mary,pedro) then friendof(pedro,tom)">
<g stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5" fill="none">
<line x1="100" y1="50" x2="100" y2="88"/>
<line x1="145" y1="50" x2="280" y2="100"/>
<line x1="320" y1="140" x2="320" y2="178"/>
<line x1="360" y1="140" x2="460" y2="210"/>
<line x1="500" y1="250" x2="500" y2="288"/>
</g>
<g font-size="12" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace, monospace">
<text x="58" y="72">l1</text>
<text x="182" y="82">l2, f1</text>
<text x="326" y="163">l1, f3</text>
<text x="392" y="182">l2, f2</text>
<text x="506" y="273">l1, f4</text>
</g>
<g font-size="13" font-family="ui-monospace, monospace">
<rect x="15" y="10" width="170" height="40" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.35"/>
<text x="100" y="35" text-anchor="middle" fill="currentColor">likes(john,tom)?</text>
<rect x="5" y="88" width="190" height="46" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.35" stroke-dasharray="3 3"/>
<text x="100" y="107" text-anchor="middle" fill="currentColor" fill-opacity="0.7">friendof(john,tom)?</text>
<text x="100" y="124" text-anchor="middle" fill="currentColor" fill-opacity="0.5" font-size="11">no such fact — fails</text>
<rect x="235" y="100" width="170" height="40" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.35"/>
<text x="320" y="125" text-anchor="middle" fill="currentColor">likes(mary,tom)?</text>
<rect x="220" y="178" width="200" height="46" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.6"/>
<text x="320" y="197" text-anchor="middle" fill="currentColor">friendof(mary,tom)</text>
<text x="320" y="214" text-anchor="middle" fill="currentColor" font-size="11">✓ success</text>
<rect x="415" y="210" width="170" height="40" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.35"/>
<text x="500" y="235" text-anchor="middle" fill="currentColor">likes(pedro,tom)?</text>
<rect x="400" y="288" width="200" height="46" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.6"/>
<text x="500" y="307" text-anchor="middle" fill="currentColor">friendof(pedro,tom)</text>
<text x="500" y="324" text-anchor="middle" fill="currentColor" font-size="11">✓ success</text>
</g>
</svg>
<figcaption>The SLD-tree for likes(john,tom). One branch fails outright; two others succeed via different chains through the friendof facts.</figcaption>
</figure>

Three things happen in this tree, and each is a clause we already know: trying `friendof(john,tom)` directly fails (no such fact), so the base-case rule (**l1**) is a dead end here. The recursive rule (**l2**) instead chains through `friendof(john,mary)` (**f1**) to ask about `likes(mary,tom)` — which itself succeeds two different ways: directly via `friendof(mary,tom)` (**f3**), or by chaining once more through `friendof(mary,pedro)` (**f2**) to `friendof(pedro,tom)` (**f4**).

Each successful leaf names the clauses it depended on — that's a conjunction. The two leaves together, joined by "or," are the query's success condition as a Boolean formula:

$$
(l_2\land f_1\land f_3)\lor(l_2\land f_1\land f_2\land f_4)
$$

which is Example 2 from the paper, and exactly what we derived by hand a few sections ago. The trick: instead of $2^n$ possible worlds, we only ever have to think about however many proofs the SLD-tree actually contains — usually a lot fewer.

### Trick 2 — trade a formula for a diagram

Having a DNF formula doesn't mean the probability is free. The two conjunctions above share `l2` and `f1` — add their probabilities directly and you'd double-count the world where both hold, which is exactly the "sum-of-products isn't sum-of-disjoint-products" problem from a few sections ago, and it's NP-hard to fix in general.

Pro<span class="accent-letter">b</span>Log's move is to stop treating the formula as a formula and compile it into a **binary decision diagram (BDD)** instead: a graph where every path from the root to a leaf is one variable assignment, dashed edges mean "this variable is false," solid edges mean "true," and — critically — any two subtrees that behave identically get merged into one shared node.

<figure class="paper-diagram">
<svg viewBox="0 0 560 430" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Binary decision diagram for (l2 and f1 and f3) or (l2 and f1 and f2 and f4), with variables tested in order l2, f1, f2, f3, f4">
<g stroke="currentColor" fill="none">
<path d="M280,43 L160,367" stroke-opacity="0.3" stroke-dasharray="3 3"/>
<path d="M280,43 L280,77" stroke-opacity="0.5"/>
<path d="M280,113 L160,367" stroke-opacity="0.3" stroke-dasharray="3 3"/>
<path d="M280,113 L280,147" stroke-opacity="0.5"/>
<path d="M280,183 L160,217" stroke-opacity="0.3" stroke-dasharray="3 3"/>
<path d="M280,183 L400,217" stroke-opacity="0.5"/>
<path d="M160,253 L160,367" stroke-opacity="0.3" stroke-dasharray="3 3"/>
<path d="M160,253 L420,367" stroke-opacity="0.5"/>
<path d="M400,253 L400,287" stroke-opacity="0.3" stroke-dasharray="3 3"/>
<path d="M400,253 L420,367" stroke-opacity="0.5"/>
<path d="M400,323 L160,367" stroke-opacity="0.3" stroke-dasharray="3 3"/>
<path d="M400,323 L420,367" stroke-opacity="0.5"/>
</g>
<g font-family="ui-monospace, monospace" font-size="13">
<circle cx="280" cy="25" r="18" fill="none" stroke="currentColor" stroke-opacity="0.5"/>
<text x="280" y="30" text-anchor="middle" fill="currentColor">l2</text>
<circle cx="280" cy="95" r="18" fill="none" stroke="currentColor" stroke-opacity="0.5"/>
<text x="280" y="100" text-anchor="middle" fill="currentColor">f1</text>
<circle cx="280" cy="165" r="18" fill="none" stroke="currentColor" stroke-opacity="0.5"/>
<text x="280" y="170" text-anchor="middle" fill="currentColor">f2</text>
<circle cx="160" cy="235" r="18" fill="none" stroke="currentColor" stroke-opacity="0.5"/>
<text x="160" y="240" text-anchor="middle" fill="currentColor">f3</text>
<circle cx="400" cy="235" r="18" fill="none" stroke="currentColor" stroke-opacity="0.5"/>
<text x="400" y="240" text-anchor="middle" fill="currentColor">f3</text>
<circle cx="400" cy="305" r="18" fill="none" stroke="currentColor" stroke-opacity="0.5"/>
<text x="400" y="310" text-anchor="middle" fill="currentColor">f4</text>
</g>
<g font-family="ui-monospace, monospace" font-size="13">
<rect x="138" y="367" width="44" height="30" rx="4" fill="none" stroke="currentColor" stroke-opacity="0.6"/>
<text x="160" y="387" text-anchor="middle" fill="currentColor">0</text>
<rect x="398" y="367" width="44" height="30" rx="4" fill="none" stroke="currentColor" stroke-opacity="0.6"/>
<text x="420" y="387" text-anchor="middle" fill="currentColor">1</text>
</g>
</svg>
<figcaption>Dashed = variable false, solid = variable true. Both f3-nodes and the f4-node have an edge straight into the same 0-terminal — that reuse is the entire point of a BDD.</figcaption>
</figure>

Read top to bottom: if `l2` or `f1` is false, we fall straight to the 0-terminal — makes sense, both conjunctions need them. Once we're past those, `f2` splits us into two genuinely different situations: if `f2` is false we only need `f3` (the left branch), but if `f2` is true we need `f3` *or* `f4` (the right branch, which is why it has an extra level). Computing the probability is now just a bottom-up walk: each node's value is $p\cdot P(\text{high child}) + (1-p)\cdot P(\text{low child})$, and because shared nodes are only stored — and computed — once, this scales with the size of the *diagram*, not the number of proofs it represents.

### Trick 3 — trade an exact answer for a bounded one

Even a BDD can get large if a query has genuinely many proofs (the paper mentions programs with tens of thousands of them). The fallback: don't insist on finishing the search.

Look at the SLD-tree again, and imagine the search gets cut off right after finding the two-hop proof (`l2∧f1∧f3`), before it ever expands `likes(pedro,tom)`. That gives two formulas instead of one: $d_1$, built only from proofs already confirmed, and $d_2$, which additionally counts the cut-off branch as if it might still succeed. Concretely:

$$
d_1 = l_2\land f_1\land f_3 \qquad\qquad d_2 = (l_2\land f_1\land f_3)\lor(l_2\land f_1\land f_2)
$$

Both are cheap to evaluate with the same machinery as trick 2, and with our actual numbers ($l_2=0.8$, $f_1=f_2=f_3=0.5$) they come out to $P(d_1)=0.2$ and $P(d_2)=0.3$. Since $d_1$ only knows about a subset of the real proofs and $d_2$ optimistically over-counts, the true answer has to sit between them — and it does: the full computation (both proofs, all four variables) comes out to exactly $0.25$. Keep searching deeper — expand `likes(pedro,tom)`, fold in `f4` — and the two bounds converge on that same number from either side. That's the whole algorithm: search a bit, get a cheap bracket on the answer, search more if the bracket isn't tight enough yet.

## Experiments, briefly

Section 6 puts all three tricks to work on real data — the biological link-discovery graphs the paper opens with in Section 2 — and reports the BDD machinery holding up on programs with hundreds of clauses and tens of thousands of proofs, well past anything a six-clause toy example would suggest. It's not a large benchmark by today's standards, but that's not really the point of this experiment: it's there to show the algorithm survives contact with a real, messy graph instead of only ever running on `likes(john,tom)`.

## Trying it myself

`pip install problog` gets you a modern, pure-Python implementation — no GPU, no CUDA, it's all symbolic manipulation. I ran three examples from the [official test suite](https://github.com/ML-KULeuven/problog/tree/master/test), each showing off a different side of the language.

<input type="radio" name="example-tab" id="example-tab-1" class="example-pager-radio" checked>
<input type="radio" name="example-tab" id="example-tab-2" class="example-pager-radio">
<input type="radio" name="example-tab" id="example-tab-3" class="example-pager-radio">

<div class="example-pager-nav">
<label for="example-tab-1">1 · Hidden Markov model</label>
<label for="example-tab-2">2 · Probabilistic graph</label>
<label for="example-tab-3">3 · Social network</label>
</div>

<div class="example-pager-panels">
<div class="example-pager-panel" id="example-panel-1">
<p class="example-desc">A hidden Markov model: tomorrow's weather depends probabilistically on today's, recursively until ten days. Nothing about Pro<span class="accent-letter">b</span>Log is HMM-specific here — this is just ordinary recursion over a time index, with the transition probabilities written as annotated disjunctions.</p>

```prolog
0.5::weather(sun,0) ; 0.5::weather(rain,0) <- true.

0.6::weather(sun,T) ; 0.4::weather(rain,T) <- T>0, Tprev is T-1, weather(sun,Tprev).
0.2::weather(sun,T) ; 0.8::weather(rain,T) <- T>0, Tprev is T-1, weather(rain,Tprev).

query(weather(sun,10)).
```

```
weather(sun,10): 0.33335081
```

</div>
<div class="example-pager-panel" id="example-panel-2">
<p class="example-desc">This is indeed the example motivates the paper — Section 2 talks at length about link discovery in biological networks but never actually writes out the code. Here it is: nodes connected by probabilistic edges, querying whether a path exists between two of them — <code>path/2</code> here has the same recursive shape as <code>likes/2</code> in our own SLD-tree walkthrough above, just renamed.</p>

```prolog
0.6::edge(1,2).
0.1::edge(1,3).
0.4::edge(2,5).
0.3::edge(2,6).
0.3::edge(3,4).
0.8::edge(4,5).
0.2::edge(5,6).

path(X,Y) :- edge(X,Y).
path(X,Y) :- edge(X,Z), Y \== Z, path(Z,Y).

query(path(1,5)).
query(path(1,6)).
```

```
path(1,5): 0.25824
path(1,6): 0.2167296
```

</div>
<div class="example-pager-panel" id="example-panel-3">
<p class="example-desc">The classic "smokers" example: stress causes smoking, smoking spreads through friendships, smoking causes asthma. This one also brings in <code>evidence/2</code> — pinning down that person 2 definitely smokes (and definitely isn't influenced by person 4) — which conditions every other query on those facts being true, rather than just computing unconditional probabilities.</p>

```prolog
0.3::stress(X) :- person(X).
0.2::influences(X,Y) :- person(X), person(Y).

smokes(X) :- stress(X).
smokes(X) :- friend(X,Y), influences(Y,X), smokes(Y).

0.4::asthma(X) <- smokes(X).

person(1). person(2). person(3). person(4).
friend(1,2). friend(2,1). friend(2,4). friend(3,2). friend(4,2).

evidence(smokes(2),true).
evidence(influences(4,2),false).

query(smokes(1)). query(smokes(2)). query(smokes(3)). query(smokes(4)).
query(asthma(1)). query(asthma(2)). query(asthma(3)). query(asthma(4)).
```

```
smokes(1): 0.50877193
smokes(2): 1
smokes(3): 0.44
smokes(4): 0.44
asthma(1): 0.20350877
asthma(2): 0.4
asthma(3): 0.176
asthma(4): 0.176
```

</div>
</div>

All three matched the expected outputs of the test files, which is a nice check that I'd actually understood the semantics rather than just the notation.

## What I think, reading it now

This paper is almost twenty years old, so of course some parts are outdated: no learning, all the probabilities have to be written by hand, and the experiments are relatively small according to today's standards. But I actually really like how this paper is written. It explains the important things very carefully, especially the semantics, why inference is NP-hard, and how BDDs are used. At the same time, it doesn't pretend to solve more than it actually does. Compared with a lot of current ML papers, where you often have to dig through pages of motivation and benchmark tables to figure out what the actual idea is, this paper is surprisingly clean and easy to follow. It feels more like reading a textbook chapter than a conference paper.

More importantly, the research direction itself has also aged pretty well. One limitation the authors mention is that Pro<span class="accent-letter">b</span>Log cannot learn its probabilities from data. You have to specify them yourself. This is exactly the problem that **<span class="accent-letter">Deep</span>ProbLog** later tries to solve. The basic idea is very natural: keep the logical structure from Pro<span class="accent-letter">b</span>Log, and use a neural network to produce some of the probabilities, so these probabilities can actually be learned from data with gradient descent. In that sense, this paper gives the probabilistic logic side of the story, and **<span class="accent-letter">Deep</span>ProbLog** later adds the neural learning part. I read **<span class="accent-letter">Deep</span>ProbLog** next, and the connection between the two papers is actually very clear.
