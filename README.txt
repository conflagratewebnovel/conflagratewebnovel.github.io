WEB SERIAL SITE  -  QUICK GUIDE
================================

WHAT'S IN HERE
  settings.txt   Colors, fonts, site name, button labels...   (edit me!)
  home.txt       The text of your homepage                    (edit me!)
  posts/         One file per post                            (add files here!)
  index.html, site.js, site.css, lib/   The machinery. You never need to touch these.


1. PUT IT ON THE INTERNET (about 5 minutes, one time)
-----------------------------------------------------
  1. Make a free account at github.com and click  New repository.
     Give it a name (for example "my-serial") and choose  Public.
  2. In the new repository click  "uploading an existing file"  and drag in
     EVERYTHING from this folder (including the "posts" and "lib" folders).
     Click  Commit changes.
     (If your computer hides the file ".nojekyll", that's fine - see "If a post
     starts with ---" near the bottom.)
  3. Go to  Settings -> Pages.  Under "Build and deployment" choose
     Source: "Deploy from a branch",  Branch: "main",  Folder: "/ (root)".  Save.
  4. After a minute or two your site is live at:
         https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/


2. CHANGE THE HOMEPAGE
----------------------
  Open  home.txt  on GitHub, click the pencil icon, edit, click "Commit changes".
  Wait a minute and refresh your site.

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
  Leave one out and it simply doesn't appear. Move it and it moves.


3. CHANGE THE LOOK
------------------
  Open  settings.txt  and edit the values after the colons. Everything is
  explained inside the file: colors, font, text size, page width, button labels,
  footer text, order of the list, hiding the numbers in titles, and so on.


4. ADD, EDIT, REMOVE POSTS
--------------------------
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
    (GitHub itself needs about a minute to publish a change.)
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
  * How the list of posts is found: the page asks GitHub "what files are in the posts
    folder?" GitHub allows about 60 such questions per hour per visitor's internet
    connection; the site remembers the answer for one minute and re-uses the last known
    list if GitHub says "too many requests". Normal readers will never notice.
  * Special-character trouble in .txt files? Both UTF-8 and old Windows (Notepad) text files are understood.
  * If a post starts with ---   (three dashes on the very first line), GitHub's built-in
    "Jekyll" tool may treat the file specially. The file ".nojekyll" in this folder switches
    Jekyll off. If your upload skipped it: in your repository click Add file -> Create new
    file, name it  .nojekyll,  leave it empty, and commit.
  * Want to preview on your own computer first? Open a terminal in this folder and run
        python3 -m http.server 8000
    then visit http://localhost:8000   (double-clicking index.html will NOT work).


LICENSES
--------
  lib/ contains two open-source libraries: mammoth.js (reads .docx, BSD-2-Clause) and
  pdf.js (reads .pdf, Apache-2.0). Their license files are included next to them.
