/* NutriMetrics goal finder — scoring engine (shared by prototype + site). Pure functions, no DOM. */
(function (root) {
  const UNDISCLOSED = 0.35; // dose factor when a label hides the amount
  const STACK = [1, 0.3, 0.15, 0.1, 0.05]; // diminishing weight for extra matching ingredients

  function index(data) {
    const ing = Object.fromEntries(data.ingredients.map((i) => [i.id, i]));
    const byGoal = {};
    for (const gi of data.goalIngredients) (byGoal[gi.g] ||= {})[gi.i] = gi;
    return { ing, byGoal };
  }

  function doseFactor(amt, eff) {
    if (amt == null) return UNDISCLOSED;
    return Math.max(0, Math.min(amt / eff, 1));
  }

  /** Score one product for one goal → { score 0..1, hits[] } */
  function goalScore(product, goal, ix) {
    const map = ix.byGoal[goal] || {};
    const hits = [];
    for (const pi of product.ingredients) {
      const gi = map[pi.i];
      if (!gi) continue;
      const eff = ix.ing[pi.i].effective;
      const df = doseFactor(pi.amt, eff);
      hits.push({ i: pi.i, amt: pi.amt, eff, ev: gi.ev, claim: gi.claim, cond: !!gi.cond, df, value: (gi.ev / 3) * df * (gi.cond ? 0.5 : 1) });
    }
    hits.sort((a, b) => b.value - a.value);
    const score = Math.min(1, hits.reduce((s, h, k) => s + h.value * (STACK[k] ?? 0.05), 0));
    return { score, hits };
  }

  /**
   * weights: { goalId: 0..3 }, market: 'ES' | 'DE'
   * returns { products: [...ranked], ingredients: [...ranked] }
   */
  function recommend(data, weights, market, opts = {}) {
    const ix = index(data);
    const goals = Object.entries(weights).filter(([, w]) => w > 0);
    const total = goals.reduce((s, [, w]) => s + w, 0);
    if (!total) return { products: [], ingredients: [] };

    const products = [];
    for (const p of data.products) {
      if (p.excluded || !p.markets || !p.markets[market]) continue;
      const perGoal = {};
      let sum = 0;
      for (const [g, w] of goals) {
        const r = goalScore(p, g, ix);
        perGoal[g] = r;
        sum += w * r.score;
      }
      const match = sum / total;
      if (match < (opts.minMatch ?? 0.08)) continue;
      const undisclosed = p.ingredients.some((x) => x.amt == null && goals.some(([g]) => ix.byGoal[g]?.[x.i]));
      products.push({ p, match, perGoal, undisclosed, availability: p.markets[market] });
    }
    products.sort((a, b) => b.match - a.match || (a.undisclosed - b.undisclosed));

    const ingScores = {};
    for (const [g, w] of goals) {
      for (const gi of Object.values(ix.byGoal[g] || {})) {
        const e = (ingScores[gi.i] ||= { i: gi.i, score: 0, goals: [] });
        e.score += ((w * gi.ev) / 3) * (gi.cond ? 0.5 : 1);
        e.goals.push({ g, ev: gi.ev, claim: gi.claim, cond: !!gi.cond, en: gi.en, es: gi.es });
      }
    }
    const ingredients = Object.values(ingScores)
      .map((e) => ({ ...e, score: e.score / total, ingredient: ix.ing[e.i],
        inMarket: data.products.filter((p) => !p.excluded && p.markets?.[market] && p.ingredients.some((x) => x.i === e.i)).length }))
      .sort((a, b) => b.score - a.score);

    return { products, ingredients };
  }

  const api = { recommend, goalScore, doseFactor, index };
  root.NMFinder = api; // browser global (also works when bundlers wrap this file as CommonJS)
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
