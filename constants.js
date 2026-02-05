// ===============================
// Application Constants
// ===============================

// Make constants available globally
window.CONSTANTS = {

// CSS Class Names
CSS_CLASSES: {
  // Components
  COMP_BODY: 'comp-body',
  COMP_LABEL: 'comp-label',
  BTN_ICON_VISUAL: 'btn-icon-visual',
  BTN_LABEL: 'btn-label',
  BTN_ICON: 'btn-icon',
  PLACEHOLDER: 'is-placeholder',
  
  // Containers
  CONTAINER: 'container',
  CONTAINER_NODE: 'container-node',
  SECTION: 'section',
  SECTION_NODE: 'section-node',
  SECTION_TITLE: 'section-title',
  CHILDREN: 'children',
  FORM: 'form',
  
  // Tree
  TREE_ITEM: 'tree-item',
  TREE_ROW: 'tree-row',
  TREE_ICON: 'tree-icon',
  TREE_LABEL: 'tree-label',
  TREE_CHILDREN: 'tree-children',
  
  // States
  SELECTED: 'selected',
  ACTIVE: 'active',
  DISABLED: 'is-disabled',
  IS_CONTAINER: 'is-container',
  IS_COMPONENT: 'is-component',
  SHOW_BORDERS: 'show-borders',
  
  // UI
  FORM_GROUP: 'form-group',
  SEGMENTED: 'segmented',
  SEG_BTN: 'seg-btn',
  MUTED: 'muted',
  EMPTY_HINT: 'empty-hint',
  LAYOUT_BADGE: 'layout-badge'
},

// HTML Selectors
SELECTORS: {
  CANVAS: '#canvas',
  TREE: '#tree',
  PROPERTIES_CONTENT: '#propertiesContent',
  HOVER_RECT: '#hoverRect',
  SELECTED_RECT: '#selectedRect',
  DROP_RECT: '#dropRect',
  
  PALETTE_ITEM: '.palette .item',
  NODE_WITH_ID: '[data-id]',
  CHILDREN_CONTAINER: ':scope > .children',
  CANVAS_WRAP: '.canvas-wrap',
  
  // Property inputs
  PROP_NAME: '#prop-name',
  PROP_CONTENT: '#prop-content',
  PROP_LABEL: '#prop-label',
  PROP_PLACEHOLDER: '#prop-placeholder',
  PROP_BTN_STYLE: '#prop-btn-style',
  PROP_BTN_ICON: '#prop-btn-icon',
  PROP_LAYOUT_TYPE: '#prop-layout-type',
  PROP_LAYOUT_OPTIONS: '#prop-layout-options',
  PROP_GRID_COLUMN: '#prop-grid-column',
  PROP_SECTION_TITLE_VISIBLE: '#prop-section-title-visible',
  PROP_SECTION_TITLE_TEXT: '#prop-section-title-text',
  PROP_FLEX_DIR: '#prop-flex-dir',
  
  // Toolbar
  BTN_SELECT_PARENT: '#btn-select-parent',
  BTN_DELETE: '#btn-delete',
  TOGGLE_SECTION_BORDERS: '#toggle-section-borders',
  VIEWPORT_TOGGLE: '#viewport-toggle',
  BTN_ICON_GROUP: '#btn-icon-group'
},

// Dataset Attributes
DATA_ATTRS: {
  ID: 'id',
  KIND: 'kind',
  VARIANT: 'variant',
  NAME: 'name',
  LAYOUT: 'layout',
  COLS: 'cols',
  FLEX_DIR: 'flexDir',
  GRID_COLUMN: 'gridColumn',
  TITLE: 'title',
  TITLE_VISIBLE: 'titleVisible',
  BTN_STYLE: 'btnStyle',
  ICON: 'icon',
  LABEL: 'label',
  VW: 'vw'
},

// Component Types
COMPONENT_KINDS: {
  CONTAINER: 'container',
  COMPONENT: 'component'
},

COMPONENT_VARIANTS: {
  // Containers
  SECTION: 'section',
  CARD: 'card',
  FORM: 'form',
  
  // Components
  BUTTON: 'button',
  INPUT: 'input',
  TEXT: 'text',
  RADIOGROUP: 'radiogroup',
  TABS: 'tabs',
  HEADER: 'header',
  DATAGRID: 'datagrid',
  LIST: 'list'
},

// Layout Types
LAYOUT_TYPES: {
  GRID: 'grid',
  FLEX: 'flex'
},

// Button Styles
BUTTON_STYLES: {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  ICON: 'icon'
},

// Flex Directions
FLEX_DIRECTIONS: {
  ROW: 'row',
  COLUMN: 'column'
},

// Default Values
DEFAULTS: {
  GRID_COLUMNS: {
    SECTION: 4,
    FORM: 4,
    CARD: 1,
    DEFAULT: 3
  },
  GRID_SPAN: 1,
  MAX_GRID_COLUMNS: 4,
  LAYOUT_TYPE: 'grid',
  FLEX_DIRECTION: 'row',
  BUTTON_STYLE: 'primary',
  SECTION_TITLE: 'Section Title',
  FORM_TITLE: 'Form Title',
  CARD_TITLE: 'Card',
  BUTTON_LABEL: 'Button',
  RADIOGROUP_LABEL: 'Radio Group'
},

// Figma Integration
FIGMA: {
  ICON_IDS: {
    compose: '111:12315',
    delete: '111:12333',
    'insert-image': '111:12324',
    inventory: '111:12359',
    print: '111:12370',
    save: '111:12402',
    url: '111:12365',
    'user-profile': '111:12411'
  }
},

// ID Generation
ID_PREFIX: 'n_',
ID_LENGTH: 7,


// Drag and Drop
DND: {
  DATA_TYPE: 'application/x-editor-item',
  EFFECT_ALLOWED: 'copy'
},

// Animation/Performance
PERFORMANCE: {
  THROTTLE_DELAY: 16, // ~60fps
  MUTATION_OBSERVER_POLL_INTERVAL: 50,
  MAX_POLL_ATTEMPTS: 50
},

// Messages
MESSAGES: {
  EMPTY_CANVAS: 'Drop a <b>Section</b> or <b>Form</b> here. Then add cards/components inside.',
  SELECT_ELEMENT: 'Select an element to edit its properties.',
  ICON_PLACEHOLDER: '⋯'
},

// Viewport Widths
VIEWPORT_WIDTHS: {
  DESKTOP: '100%',
  TABLET: '768',
  MOBILE: '360'
},

// Grid Column Options
GRID_COLUMN_OPTIONS: [1, 2, 3, 4],

// Mutation Observer Config
MUTATION_CONFIG: {
  CANVAS: {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'data-layout', 'data-cols', 'data-flex-dir', 'data-grid-column']
  },
  CANVAS_ATTR: {
    attributes: true,
    attributeFilter: ['data-vw', 'style']
  },
  PROPERTIES: {
    childList: true,
    subtree: true
  }
},

// Overlay Settings (needs to be defined after moving it)
OVERLAY: {
  Z_INDEX: {
    HOVER: '999999',
    SELECTED: '999999',
    DROP: '999998'
  },
  OFFSET: 1,
  BACKGROUND: {
    HOVER: 'rgba(0, 123, 255, 0.1)',
    SELECTED: 'rgba(121, 40, 225, 0.15)',
    DROP: 'rgba(121, 40, 225, 0.05)'
  }
}

}; // Close window.CONSTANTS
