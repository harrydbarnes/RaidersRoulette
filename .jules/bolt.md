## 2024-05-23 - DOM Recycling and Focus
**Learning:** When reordering a list of interactive elements (like checkboxes), using `replaceChildren` or clearing `innerHTML` destroys the elements and causes the active element to lose focus.
**Action:** Use `appendChild` to move existing DOM nodes to their new positions. This preserves the element's identity and focus state, enhancing UX while optimizing performance (DOM pooling).
