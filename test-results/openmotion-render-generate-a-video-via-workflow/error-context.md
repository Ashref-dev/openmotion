# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - status [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e5]
      - generic [ref=e7]:
        - text: Static route
        - button "Hide static indicator" [ref=e8] [cursor=pointer]:
          - img [ref=e9]
  - alert [ref=e12]
  - generic [ref=e13]:
    - link "Back to Project" [ref=e15] [cursor=pointer]:
      - /url: /projects/3c3e940b-157c-42b3-b4c8-0a76fc166f8e
      - button "Back to Project" [ref=e16]:
        - img
        - text: Back to Project
    - generic [ref=e18]:
      - generic [ref=e20]:
        - generic [ref=e21]: Render Status
        - generic [ref=e22]: Bundling Remotion Project
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]:
            - generic [ref=e26]: Progress
            - generic [ref=e27]: 0%
          - progressbar [ref=e28]
        - generic [ref=e30]:
          - img [ref=e31]
          - generic [ref=e33]: Rendering in progress...
        - generic [ref=e35]:
          - generic [ref=e36]: Started
          - generic [ref=e37]: 2/7/2026, 5:02:54 PM
        - button "Cancel Render" [ref=e39]:
          - img
          - text: Cancel Render
```