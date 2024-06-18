CKEDITOR.editorConfig = function( config ) {
  config.toolbarGroups = [
    { name: "clipboard", groups: [ "clipboard", "undo" ] },
    { name: "editing", groups: [ "find", "selection", "spellchecker", "editing" ] },
    { name: "basicstyles", groups: [ "basicstyles", "cleanup" ] },
    { name: "insert", groups: [ "insert" ] },
    { name: "links", groups: [ "links" ] },
    { name: "forms", groups: [ "forms" ] },
    { name: "document", groups: [ "mode", "document", "doctools" ] },
    { name: "others", groups: [ "others" ] },
    { name: "paragraph", groups: [ "list", "indent", "blocks", "align", "bidi", "paragraph" ] },
    { name: "styles", groups: [ "styles" ] },
    { name: "colors", groups: [ "colors" ] },
    { name: "tools", groups: [ "tools" ] },
    { name: "about", groups: [ "about" ] }
  ];
  config.removeButtons = "Scayt,Cut,Copy,Paste,PasteText,PasteFromWord,Undo,Redo,Source,Styles,About";
  config.removeDialogTabs = "image:advanced;link:advanced";
};
