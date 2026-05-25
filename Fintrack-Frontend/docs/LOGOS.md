Place the provided logo image files into the frontend assets folder so the Others page can display them.

Expected destination (relative to project root):

- `Fintrack-Frontend/src/assets/others/bank.png`
- `Fintrack-Frontend/src/assets/others/tide.png`
- `Fintrack-Frontend/src/assets/others/amazon-pay.png`

Notes:

- Filenames must match exactly (lowercase, hyphen for amazon-pay).
- The component references `assets/others/*` which maps to `Fintrack-Frontend/src/assets/others` after the Angular build.
- If you prefer different names, update the `img src` paths in `Fintrack-Frontend/src/app/features/other/other.component.html` accordingly.

To add the images from the conversation attachments, save each attached image into the `src/assets/others` folder using the filenames above.
