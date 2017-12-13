// install

function insertScript(source) {
  var s = document.createElement('script');
  s.setAttribute('type','text/javascript');
  s.setAttribute('src',source);
  s.setAttribute('class','jupyter-sidenote-script');
  if (typeof s!='undefined') {
    document.getElementsByTagName('head')[0].appendChild(s);
  }
}
var src = 'https://jangxyz.github.io/jupyter-sidenote/dist/main.js';
insertScript(src);

