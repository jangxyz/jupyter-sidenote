
const nb = IPython.notebook;

const SIDENOTE_MAGIC = '<!-- jupyter-side-memo -->';

const GLOBAL_BUTTONGROUP_CL = 'jupyter-sidenote-global-memo-button-group';
const GLOBAL_BUTTON_CL      = 'jupyter-sidenote-global-memo-button';
const STYLE_ALL_APPLIED_CL  = 'jupyter-sidenote-allstyle-applied';

const CONTENT_STYLE_CL = 'jupyter-sidenote-content-style';
const MEMO_STYLE_CL    = 'jupyter-sidenote-memo-style';

const STYLE = `
  .jupyter-sidenote-content-style {
    display: inline-block !important;
    width: 60% !important;
  }

  .jupyter-sidenote-memo-style {
    display: inline-block !important;
    width: 40% !important;
    vertical-align: top !important;
    /*margin-top: 6px !important;*/
  }
  .jupyter-sidenote-memo-style .inner_cell {
    border: 1px solid white;
    border: 1px solid transparent;
  }
  .jupyter-sidenote-memo-style.rendered:not(.selected) .inner_cell {
    border: 1px solid rgb(251, 218, 69);
  }
  .jupyter-sidenote-memo-style.rendered .inner_cell {
    background-color: rgb(252,250,197);
    background-color: rgba(252,250,197, 0.5);
  }
  .jupyter-sidenote-memo-style.rendered .inner_cell .rendered_html pre {
    margin: 1em 1em;
  }
  .jupyter-sidenote-memo-style.rendered .inner_cell .rendered_html pre,
  .jupyter-sidenote-memo-style.rendered .inner_cell .rendered_html code {
    background-color: transparent;
  }

  .rendered.cell.jupyter-sidenote-memo-style .rendered_html .cell-jupyter-sidenote-memo-off {
    display: none;
  }
  .rendered.cell.jupyter-sidenote-memo-style .rendered_html .cell-jupyter-sidenote-memo-on {
    display: block !important;
  }
  .rendered.cell:not(.jupyter-sidenote-memo-style) .rendered_html .cell-jupyter-sidenote-memo-on {
    display: none;
  }

  .jupyter-sidenote-memo-style.unrendered .CodeMirror-wrap:not(.CodeMirror-focused) .CodeMirror-lines .CodeMirror-code > *:first-child .CodeMirror-line {
    background-color: #a50;
  }
  .jupyter-sidenote-memo-style.unrendered .CodeMirror-wrap:not(.CodeMirror-focused) .CodeMirror-lines .CodeMirror-code > *:first-child .CodeMirror-line > * > * {
    display: none;
  }

  .sidenote-memo-toggle-button {
    position: absolute; 
    top: -1px; 
    right: -1px;
    border-radius: 0 0 0 3px;
    z-index: 3;
  }
  .input_area .cm-s-ipython .sidenote-memo-toggle-button {
    border: 1px solid #cfcfcf;
  }
  .input_area .cm-s-ipython.CodeMirror-focused .sidenote-memo-toggle-button {
    background-color: rgb(254, 248, 171);
    background: linear-gradient(rgb(252,250,197), rgb(254, 248, 171));
    border: 1px solid rgb(251, 218, 69);
  }

  .jupyter-sidenote-global-memo-button.btn.btn-default {
    color: rgb(254, 248, 171);
  }
  .jupyter-sidenote-global-memo-button.jupyter-sidenote-allstyle-applied.btn.btn-default {
    background-color: rgb(254, 248, 171);
    background: linear-gradient(rgb(252,250,197), rgb(254, 248, 171));
    border: 1px solid rgb(251, 218, 69);
    color: rgb(251, 218, 69);
  }
`;

function onLoad() {
}

// insert

//
// Notebook adapter
//

function _confirmCellIndex(_cellIndex) {
  let cellIndex;
  if (Number.isInteger(_cellIndex) || _cellIndex === -1) {
    cellIndex = nb.find_cell_index(nb.get_selected_cell());
  } else {
    cellIndex = _cellIndex;
  }

  return cellIndex;
}


function _getCurrentSelectedCell() {
  return nb.get_selected_cell();
}
function _getCurrentSelectedCellIndex() {
  return nb.find_cell_index(nb.get_selected_cell());
}

function _selectCellByIndex(cellIndex) {
  return nb.select(cellIndex);
}

function _getCell(cellIndex) {
  return nb.get_cell(cellIndex);
}

function _convertToMarkdown(_cellIndex) {
  const cellIndex = _confirmCellIndex(_cellIndex);

  nb.to_markdown(cellIndex);
}

function _editCellByCellIndex(cellIndex) {
  nb.select(cellIndex);
  nb.edit_mode();
}

function _insertCellBelow(_cellIndex) {
  const cellIndex = _confirmCellIndex(_cellIndex);

  nb.command_mode();
  const newCell = nb.insert_cell_below();

  _editCellByCellIndex(cellIndex + 1);

  return newCell;
}


//
// cells
//

function isCell($cell) {
  if (!$cell) { return null; }
  return $cell.classList.contains('cell');
}

function nextCell($cell) {
  const $nextCell = $cell.nextElementSibling;
  if (!isCell($nextCell)) { return null; }
  return $nextCell;
}
function prevCell($cell) {
  const $prevCell = $cell.previousElementSibling;
  if (!isCell($prevCell)) { return null; }
  return $prevCell;
}

function isMarkdown($cell) {
  if (!$cell) { return null; }
  return $cell.classList.contains('text_cell');
}

function isCode($cell) {
  if (!$cell) { return null; }
  return $cell.classList.contains('code_cell');
}


// $cell ==> cellIndex
function getCellIndex($cell) {
  const $siblings = Array.from($cell.parentElement.childNodes.values());
  const cellIndex = $siblings.findIndex($el => $el === $cell);
  return cellIndex;
}

function getCellFromIndex(cellIndex) {
  return _getCell(cellIndex);
}
function getCellFrom$cell($cell) {
  const cellIndex = getCellIndex($cell);
  return getCellFromIndex(cellIndex);
}

function insertCellBelow($cell) {
  const cellIndex = getCellIndex($cell);
  const newCell = _insertCellBelow(cellIndex);
  return newCell.element[0];
}

//
// sidememo
//

function getAllCells() {
  const $cellsIter = document.querySelectorAll('#notebook-container > .cell');
  return Array.from($cellsIter.values());
}

function getLines($cell) {
  const $cm = $cell.querySelector('.input_area > .CodeMirror');
  const $lines = $cm.querySelectorAll('.CodeMirror-lines .CodeMirror-code .CodeMirror-line');
  const lines = Array.from($lines.values()).map($el => $el.textContent);

  return lines;
}

function isSidenoteMemo($cell) {
  if (!$cell) { return null; }
  if (!isMarkdown($cell)) { return false; }

  const lines = getLines($cell);
  return lines.filter(x => x)
    .find(line => line.match(SIDENOTE_MAGIC))
  ;
}

function convertToMarkdownFromIndex(cellIndex) {
  _convertToMarkdown(cellIndex);
}
//function convertToMarkdown($cell) {
//  const cellIndex = getCellIndex($cell);
//  convertToMarkdownFromIndex(cellIndex);
//}

function convertToSideMemoCell($cell) {
  if (isSidenoteMemo($cell)) {
    return $cell;
  }

  // convert to markdown
  const cellIndex = getCellIndex($cell);
  convertToMarkdownFromIndex(cellIndex);

  // insert magic comment
  const cell = insertMagicCommentByCellIndex(cellIndex);

  return cell.element[0];
}
function insertMagicCommentByCellIndex(cellIndex) {
  const cell = getCellFromIndex(cellIndex);
  const text = cell.get_text();

  const newText = text ? `${SIDENOTE_MAGIC}\n${text}` : `${SIDENOTE_MAGIC}\n`;
  cell.set_text(newText);

  return cell;
}
function removeMagicComment($cell) {
  if (isMarkdown($cell)) {
    const cell = getCellFrom$cell($cell);

    const lines = cell.get_text().split('\n');
    const magicCommentIndex = lines.findIndex((line) => line.trim() === SIDENOTE_MAGIC);

    //
    const emptyHead = lines.slice(0, magicCommentIndex).filter(x => x).length === 0;
    const hasStartingMagicComment = magicCommentIndex !== -1 && emptyHead;
    if (!hasStartingMagicComment) {
      return;
    }

    lines.splice(magicCommentIndex, 1);
    cell.set_text(lines.join('\n'));

  } else {
    console.warn('not implemented for others beside markdown, for now.');
    return;
  }
}


function hasSidenoteContentStyle($cell) {
  if (!$cell) {
    return null;
  }
  return $cell.classList.contains(CONTENT_STYLE_CL);
}
function hasSidenoteMemoStyle($cell) {
  if (!$cell) {
    return null;
  }
  return $cell.classList.contains(MEMO_STYLE_CL);
}

function applySideMemoStyle($cell, $memo) {
  //cell.element.classList

  jQuery($cell)
    .addClass(CONTENT_STYLE_CL)
    .data('prev-style', $cell.getAttribute('style'))
  ;

  if (isSidenoteMemo($memo)) {
    jQuery($memo)
      .addClass(MEMO_STYLE_CL)
      .data('prev-style', $memo.getAttribute('style'))
    ;
  }
}
function resetSideMemoStyle($cell, $memo) {
  $cell.setAttribute('style', jQuery($cell).data('prev-style'));
  $cell.classList.remove(CONTENT_STYLE_CL);
  $memo.setAttribute('style', jQuery($memo).data('prev-style'));
  $memo.classList.remove(MEMO_STYLE_CL);
}


//
//
//

function addSidenoteMemo($cell) {
  //if (!isSidenoteMemo($cell)) {
  //  return null;
  //}

  let $nextCell = nextCell($cell);

  // insert new side memo cell
  if (!isSidenoteMemo($nextCell)) {
    $nextCell = insertCellBelow($cell);
  }

  const $memo = convertToSideMemoCell($nextCell);

  // add style
  applySideMemoStyle($cell, $memo);

  // select memo cell
  const memoCellIndex = getCellIndex($memo);
  _selectCellByIndex(memoCellIndex);

  // enable edit mode
  _editCellByCellIndex(memoCellIndex);

  return $memo;
}

function removeSideMemo($cell) {
  //
  const currentSelectedIndex = _getCurrentSelectedCellIndex();

  //
  let $memo;
  if (isSidenoteMemo($cell)) {
    $memo = $cell;
    $cell = prevCell($memo);
  } else {
    const $nextCell = nextCell($cell);
    // cannot find side memo.
    if (!isSidenoteMemo($nextCell)) {
      return;
    }
    $memo = $nextCell;
  } // ensure $memo and $cell at this point.

  // remove magic comment
  removeMagicComment($memo);

  // remove style
  resetSideMemoStyle($cell, $memo);

  // re-select first selected cell.
  _selectCellByIndex(currentSelectedIndex);
}

//

function buildCellToggleMemoButton($cell) {
  const $button = document.createElement('button');
  $button.setAttribute('class', 'sidenote-memo-toggle-button');
  $button.textContent = '→';

  $button.addEventListener('click', (ev) => {
    console.log('click.', ev);

    const hasStyle = hasSidenoteContentStyle($cell);
    if (hasStyle) {
      const $memo = nextCell($cell);
      resetSideMemoStyle($cell, $memo);
      //
      $button.textContent = '→';
    } else {
      addSidenoteMemo($cell);
      //
      $button.textContent = '←';
    }
  });

  return $button;
}



function buildCellSelectMemoButton($cell) {
  const $button = document.createElement('button');
  $button.setAttribute('class', 'sidenote-memo-toggle-button');
  $button.innerHTML = '<i class="fa-file-o fa"></i>';

  $button.addEventListener('click', (ev) => {
    const $nextCell = nextCell($cell);
    // insert memo
    if (!isSidenoteMemo($nextCell)) {
      addSidenoteMemo($cell);
    }
    // select memo
    else {
      setTimeout(() => {
        const memoCellIndex = getCellIndex($nextCell);
        console.log('selecting:', memoCellIndex, $nextCell);
        _editCellByCellIndex(memoCellIndex);
      }, 0);
    }
  });

  return $button;
}

function attachMemoButton($cell) {
  // do not add button to memo
  if (isSidenoteMemo($cell)) {
    return null;
  }

  let $button = $cell.querySelector('.sidenote-memo-toggle-button');
  if ($button) {
    return $button;
  }
  //
  $button = buildCellSelectMemoButton($cell);

  //
  //$cell.appendChild($button);
  $cell.querySelector('.input_area > .CodeMirror[class*="cm-s-"]').appendChild($button);

  //
  return $button;
}
function detachMemoButton($cell) {
  const $button = $cell.querySelector('.sidenote-memo-toggle-button');
  if ($button) {
    $button.remove();
  }
}

//
// installation
//

function applySidenoteToNewCell(ev, cellObj) {
  console.log('create new cell:', ev, cellObj);
  const $cell = cellObj.cell.element[0];
  attachMemoButton($cell);

  const $memo = nextCell($cell);
  if (isSidenoteMemo($memo)) {
    applySideMemoStyle($cell, $memo);
  }
}


function applyAllMemoStyles($cells) {
  const $memos = $cells.filter(isSidenoteMemo);
  $memos.forEach(($memo) => {
    const $cell = prevCell($memo);
    applySideMemoStyle($cell, $memo);
  });
}

function resetAllMemoStyles($cells) {
  const $memos = $cells.filter(isSidenoteMemo);
  $memos.forEach(($memo) => {
    const $cell = prevCell($memo);
    resetSideMemoStyle($cell, $memo);
  });
}

function hasAnyMemoStyleApplied($cells) {
  if ($cells.some($cell => $cell.classList.contains(CONTENT_STYLE_CL))) {
    return true;
  }

  if ($cells.some($cell => $cell.classList.contains(MEMO_STYLE_CL))) {
    return true;
  }

  return false;
}


function buildToolbarMemoButton() {
  const $button = document.createElement('button');
  $button.setAttribute('class', `btn btn-default ${GLOBAL_BUTTON_CL}`);
  $button.innerHTML = '<i class="fa-file fa"></i>';

  $button.addEventListener('click', (ev) => {
    //console.log('click.', ev);

    const $cells = getAllCells();
    if (hasAnyMemoStyleApplied($cells)) {
      resetAllMemoStyles($cells);
      $button.classList.remove(STYLE_ALL_APPLIED_CL);
    } else {
      applyAllMemoStyles($cells);
      $button.classList.add(STYLE_ALL_APPLIED_CL);
    }
  });

  return $button;
}

function attachGlobalButton() {
  const $toolbar = document.querySelector('#maintoolbar-container');
  const $globalButton = buildToolbarMemoButton();
  $toolbar.appendChild(
    (
      jQuery(`<div class="btn-group ${GLOBAL_BUTTONGROUP_CL}" />`)
        .append($globalButton)
    )[0]
  );

  return $globalButton;
}

function detachGlobalButton() {
  const $globalButtonGroup = document.querySelector(`#maintoolbar-container .${GLOBAL_BUTTONGROUP_CL}`);
  $globalButtonGroup && $globalButtonGroup.remove();
}


function insertStyle() {
  const $style = document.createElement('style');
  $style.setAttribute('type', 'text/css');
  $style.setAttribute('class', 'jupyter-sidenote-style');
  $style.textContent = STYLE.trim();

  document.head.appendChild($style);
  return $style;
}
function removeStyle() {
  const $styles = document.head.querySelectorAll(`.jupyter-sidenote-style`);
  $styles.forEach($style => $style.remove());
}

function isInstalled() {
  return window['jupyter-sidenote'] && window['jupyter-sidenote'].installed;
}

function install() {
  //
  insertStyle();

  // add global toolbar
  attachGlobalButton();

  const $cells = getAllCells();
  // attach memo buttons and apply style
  $cells.forEach(attachMemoButton);
  applyAllMemoStyles($cells);

  //
  if (Jupyter && Jupyter.notebook) {
    Jupyter.notebook.events.on('create.Cell', applySidenoteToNewCell);
  }

  //
  window['jupyter-sidenote'] = { installed: true };
}

function uninstall() {
  // unregister
  if (Jupyter && Jupyter.notebook) {
    Jupyter.notebook.events.off('create.Cell', applySidenoteToNewCell);
  }

  const $cells = getAllCells();
  // reset all memo style
  resetAllMemoStyles($cells);
  // remove memo buttons
  $cells.forEach(detachMemoButton);

  // remove global button
  detachGlobalButton();

  document.querySelectorAll('[class^=jupyter-sidenote-]')
    .forEach((el) => el.remove());

  //
  delete window['jupyter-sidenote'];
}

function toggleRun() {
  if (isInstalled()) {
    uninstall();
  } else {
    install();
  }
}

///
module.exports = toggleRun;

