2. CHANGE THE HOMEPAGE
  What you can write in home.txt (and in .txt / .md posts):
      # Big heading        ## Medium heading        ### Small heading
      **bold**    *italic*    [link text](https://example.com)
      a line with only --- or *** is a divider
      an empty line starts a new paragraph
      - a list item          > a quote          (lists and quotes: home.txt and .md only)

  Special spots that turn into something automatically:
      {{posts}}    the list of all posts
      {{first}}    a "Start reading" button      ({{first|Begin the story}} changes the label)
      {{latest}}   a "Read the latest" button    ({{latest|Newest chapter}} too)
      {{count}}    the number of posts


4. ADD, EDIT, REMOVE POSTS
  Add     Open the  posts  folder on GitHub -> Add file -> Upload files.
  Edit    Upload a new version with the exact same file name (or use the pencil on .txt/.md files).
  Remove  Click the file -> the trash can icon -> Commit changes.

  * The FILE NAME is the post title (without .txt/.docx/...).
  * Posts are ordered by the file name, numbers counted properly:
        1 The Beginning.txt
        2 The Second Post.txt
        10 Still Going.txt        <- comes after 2, not after 1
    Decimals work too:  1.1 Arrival.docx,  1.2 Departure.docx,  2.1 ...
  * Every post gets Previous / Contents / Next buttons automatically.
    The left/right arrow keys also work.
  * New or removed files show up on the site on their own - nothing to register.
  * Files starting with an underscore (_draft.txt) are not listed. Handy for drafts,
    but they are hidden, NOT private.

  SUPPORTED FILE TYPES
    .txt   plain text (best for web serials; blank line = new paragraph)
    .md    text with the formatting above
    .docx  Word documents (bold/italic/headings are kept; images are not shown)
    .pdf   shown as plain text. PDFs have no real paragraphs, so the site guesses where
           they were; it works well for normal text but not for scans, columns or tables.
    .doc   OLD Word format - browsers can't read it. Open it in Word and "Save As" .docx.
  For the most reliable result use .txt or .docx.


5. GOOD TO KNOW
---------------
  * Own domain name (not username.github.io)?  Add this line to settings.txt:
        github-repo: your-username/your-repository
    The repository must be public.
  * Special-character trouble in .txt files? Both UTF-8 and old Windows (Notepad) text files are understood.
  * Want to preview on your own computer first? Open a terminal in this folder and run
        python3 -m http.server 8000
    then visit http://localhost:8000   (double-clicking index.html will NOT work).


LICENSES
--------
  lib/ contains two open-source libraries: mammoth.js (reads .docx, BSD-2-Clause) and
  pdf.js (reads .pdf, Apache-2.0). Their license files are included next to them.
