<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep test-pricing normalization in a pure shared module used by admin writes, so category-based fees and government-rate rules are enforced consistently.
- Keep admin section navigation and its catalog overview in the authenticated admin shell, reusing existing tab panels so admin tools remain in place.
