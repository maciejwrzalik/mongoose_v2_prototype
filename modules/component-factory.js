// ===============================
// Component Factory
// ===============================
// Centralizes component creation logic

class ComponentFactory {
  constructor() {
    // Component registry: variant -> constructor
    this.registry = new Map();
    
    // Initialize registry (will be populated after component classes load)
    this._initialized = false;
  }
  
  /**
   * Initialize the factory with component constructors
   * Called after all component scripts have loaded
   */
  initialize() {
    if (this._initialized) return;
    
    // Register containers
    this.register('section', Section);
    this.register('card', Card);
    this.register('form', Form);
    this.register('splitter', Splitter);
    
    // Register components
    this.register('text', TextComponent);
    this.register('button', ButtonComponent);
    this.register('input', InputComponent);
    this.register('radiogroup', RadioGroupComponent);
    this.register('datagrid', DatagridComponent);
    this.register('tabs', TabsComponent);
    this.register('header', HeaderComponent);
    this.register('list', ListComponent);
    
    this._initialized = true;
  }
  
  /**
   * Register a component constructor
   * @param {string} variant - The component variant name
   * @param {Function} constructor - The component constructor
   */
  register(variant, constructor) {
    if (typeof constructor !== 'function') {
      console.warn(`ComponentFactory: Invalid constructor for variant "${variant}"`);
      return;
    }
    this.registry.set(variant, constructor);
  }
  
  /**
   * Unregister a component
   * @param {string} variant - The component variant name
   */
  unregister(variant) {
    this.registry.delete(variant);
  }
  
  /**
   * Create a component instance
   * @param {string} kind - The component kind ('container' or 'component')
   * @param {string} variant - The component variant
   * @returns {NodeComponent|null} The component instance or null if not found
   */
  create(kind, variant) {
    if (!this._initialized) {
      this.initialize();
    }
    
    const Constructor = this.registry.get(variant);
    
    if (!Constructor) {
      console.warn(`ComponentFactory: No constructor found for variant "${variant}"`);
      return null;
    }
    
    try {
      return new Constructor();
    } catch (error) {
      console.error(`ComponentFactory: Error creating component "${variant}":`, error);
      return null;
    }
  }
  
  /**
   * Check if a variant is registered
   * @param {string} variant - The component variant
   * @returns {boolean}
   */
  isRegistered(variant) {
    if (!this._initialized) {
      this.initialize();
    }
    return this.registry.has(variant);
  }
  
  /**
   * Get all registered variants
   * @returns {string[]}
   */
  getRegisteredVariants() {
    if (!this._initialized) {
      this.initialize();
    }
    return Array.from(this.registry.keys());
  }
  
  /**
   * Get variants by kind
   * @param {string} kind - 'container' or 'component'
   * @returns {string[]}
   */
  getVariantsByKind(kind) {
    if (!this._initialized) {
      this.initialize();
    }
    
    const variants = [];
    for (const [variant, Constructor] of this.registry.entries()) {
      try {
        const instance = new Constructor();
        if (instance.kind === kind) {
          variants.push(variant);
        }
      } catch (e) {
        // Skip if instantiation fails
      }
    }
    return variants;
  }
}

// Create a singleton instance
window.componentFactory = new ComponentFactory();
