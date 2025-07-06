import { createEventBus, type EventBus } from './event-bus.js';

export type NavigationState = {
  currentView: 'dashboard' | 'plugins' | 'settings' | 'logs' | 'plugin-detail';
  selectedPluginId?: string;
  settingsTarget?: {
    pluginId: string;
    focusEditor?: boolean;
  };
  urlParams?: Record<string, string>;
};

export type NavigationEvents = {
  'navigation:change': NavigationState;
  'navigation:configure-plugin': { pluginId: string; source: 'plugins' | 'plugin-detail' | 'dashboard' };
  'navigation:back': { from: string; to: string };
  'navigation:error': { error: string; context?: string };
};

export class NavigationService {
  private eventBus: EventBus<NavigationEvents>;
  private currentState: NavigationState;
  private history: NavigationState[] = [];
  private maxHistorySize = 50;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private isNavigating = false;
  private eventListeners: Array<{ type: string; listener: EventListener }> = [];

  constructor() {
    this.eventBus = createEventBus<NavigationEvents>();
    this.currentState = {
      currentView: 'dashboard',
    };
    this.history.push({ ...this.currentState });
  }

  // Event subscription methods
  on<K extends keyof NavigationEvents>(
    event: K,
    handler: (payload: NavigationEvents[K]) => void
  ): () => void {
    this.eventBus.subscribe(event, handler);
    // Return cleanup function
    return () => {
      this.eventBus.unsubscribe(event, handler);
    };
  }

  off<K extends keyof NavigationEvents>(
    event: K,
    handler: (payload: NavigationEvents[K]) => void
  ): void {
    this.eventBus.unsubscribe(event, handler);
  }

  // Navigation state methods
  getCurrentState(): NavigationState {
    return { ...this.currentState };
  }

  getHistory(): NavigationState[] {
    return [...this.history];
  }

  // Primary navigation methods
  navigateTo(view: NavigationState['currentView'], options?: {
    pluginId?: string;
    settingsTarget?: NavigationState['settingsTarget'];
    replaceHistory?: boolean;
    skipDebounce?: boolean;
  }): void {
    // Validate navigation state
    if (!this.isValidView(view)) {
      this.handleNavigationError(`Invalid view: ${view}`);
      return;
    }

    // Prevent concurrent navigation calls
    if (this.isNavigating && !options?.skipDebounce) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.debug('[NavigationService] Navigation already in progress, ignoring call');
      }
      return;
    }

    // Debounce rapid navigation calls
    if (!options?.skipDebounce) {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      this.debounceTimeout = setTimeout(() => {
        this.performNavigation(view, options);
        this.debounceTimeout = null;
      }, 50); // 50ms debounce
      return;
    }

    this.performNavigation(view, options);
  }

  private performNavigation(view: NavigationState['currentView'], options?: {
    pluginId?: string;
    settingsTarget?: NavigationState['settingsTarget'];
    replaceHistory?: boolean;
  }): void {
    this.isNavigating = true;

    try {
      const newState: NavigationState = {
        currentView: view,
        selectedPluginId: options?.pluginId,
        settingsTarget: options?.settingsTarget,
        urlParams: this.extractUrlParams(),
      };

      // Check if this is actually a state change
      if (this.isStateSame(this.currentState, newState)) {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
          console.debug('[NavigationService] State unchanged, skipping navigation');
        }
        return;
      }

      if (!options?.replaceHistory) {
        this.addToHistory(newState);
      }

      this.currentState = newState;
      this.updateUrl();
      this.eventBus.publish('navigation:change', newState);
    } catch (error) {
      this.handleNavigationError(`Navigation failed: ${error}`, JSON.stringify(options));
    } finally {
      this.isNavigating = false;
    }
  }

  // Plugin configuration navigation
  navigateToPluginConfig(pluginId: string, source: 'plugins' | 'plugin-detail' | 'dashboard'): void {
    console.log(`[NavigationService] Navigating to plugin configuration: ${pluginId} from ${source}`);
    
    const settingsTarget = {
      pluginId,
      focusEditor: true,
    };

    this.navigateTo('settings', { settingsTarget, skipDebounce: true });
    this.eventBus.publish('navigation:configure-plugin', { pluginId, source });
  }

  // Plugin detail navigation
  navigateToPluginDetail(pluginId: string): void {
    console.log(`[NavigationService] Navigating to plugin detail: ${pluginId}`);
    this.navigateTo('plugin-detail', { pluginId });
  }

  // Back navigation
  navigateBack(): boolean {
    if (this.history.length <= 1) {
      return false;
    }

    // Remove current state from history
    this.history.pop();
    
    // Get the previous state
    const previousState = this.history[this.history.length - 1];
    
    this.currentState = { ...previousState };
    this.updateUrl();
    this.eventBus.publish('navigation:change', this.currentState);
    this.eventBus.publish('navigation:back', {
      from: this.currentState.currentView,
      to: previousState.currentView,
    });

    return true;
  }

  // URL handling methods
  private extractUrlParams(): Record<string, string> {
    const params: Record<string, string> = {};
    
    if (typeof window !== 'undefined' && window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }
    
    return params;
  }

  private updateUrl(): void {
    if (typeof window === 'undefined' || !window.history) {
      return;
    }

    const url = this.buildUrl();
    
    try {
      window.history.replaceState(
        { navigationState: this.currentState },
        '',
        url
      );
    } catch (error) {
      console.warn('[NavigationService] Failed to update URL:', error);
    }
  }

  private buildUrl(): string {
    const params = new URLSearchParams();
    
    // Add view parameter
    if (this.currentState.currentView !== 'dashboard') {
      params.set('view', this.currentState.currentView);
    }
    
    // Add plugin ID if present
    if (this.currentState.selectedPluginId) {
      params.set('plugin', this.currentState.selectedPluginId);
    }
    
    // Add settings target if present
    if (this.currentState.settingsTarget) {
      params.set('configure', this.currentState.settingsTarget.pluginId);
      if (this.currentState.settingsTarget.focusEditor) {
        params.set('focus', 'editor');
      }
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Initialize from URL on startup
  initializeFromUrl(): void {
    const urlParams = this.extractUrlParams();
    
    if (Object.keys(urlParams).length === 0) {
      return;
    }

    console.log('[NavigationService] Initializing from URL params:', urlParams);

    const view = urlParams.view as NavigationState['currentView'] || 'dashboard';
    const pluginId = urlParams.plugin;
    const configurePluginId = urlParams.configure;
    const focusEditor = urlParams.focus === 'editor';

    let settingsTarget: NavigationState['settingsTarget'] | undefined;
    if (configurePluginId) {
      settingsTarget = {
        pluginId: configurePluginId,
        focusEditor,
      };
    }

    // Navigate to the URL-specified state
    this.navigateTo(view, {
      pluginId,
      settingsTarget,
      replaceHistory: true,
    });
  }

  // History management
  private addToHistory(state: NavigationState): void {
    this.history.push({ ...state });
    
    // Trim history if it gets too long
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  // Browser navigation support
  setupBrowserNavigation(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Handle browser back/forward buttons
    const popstateHandler = (event: PopStateEvent) => {
      if (event.state?.navigationState) {
        this.currentState = event.state.navigationState;
        this.eventBus.publish('navigation:change', this.currentState);
      } else {
        // If no state, try to parse from URL
        this.initializeFromUrl();
      }
    };

    window.addEventListener('popstate', popstateHandler);
    this.eventListeners.push({ type: 'popstate', listener: popstateHandler as EventListener });

    // Handle initial page load
    this.initializeFromUrl();
  }

  // Utility methods
  private isValidView(view: string): view is NavigationState['currentView'] {
    const validViews = ['dashboard', 'plugins', 'settings', 'logs', 'plugin-detail'];
    return validViews.includes(view);
  }

  private isStateSame(state1: NavigationState, state2: NavigationState): boolean {
    return (
      state1.currentView === state2.currentView &&
      state1.selectedPluginId === state2.selectedPluginId &&
      JSON.stringify(state1.settingsTarget) === JSON.stringify(state2.settingsTarget)
    );
  }

  isCurrentView(view: NavigationState['currentView']): boolean {
    return this.currentState.currentView === view;
  }

  isPluginSelected(pluginId: string): boolean {
    return this.currentState.selectedPluginId === pluginId;
  }

  isPluginConfigurationTarget(pluginId: string): boolean {
    return this.currentState.settingsTarget?.pluginId === pluginId;
  }

  shouldFocusEditor(): boolean {
    return this.currentState.settingsTarget?.focusEditor === true;
  }

  // Error handling
  handleNavigationError(error: string, context?: string): void {
    console.error(`[NavigationService] Navigation error: ${error}`, context);
    this.eventBus.publish('navigation:error', { error, context });
  }

  // Cleanup
  destroy(): void {
    // Clear debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    // Remove all event listeners
    if (typeof window !== 'undefined') {
      this.eventListeners.forEach(({ type, listener }) => {
        window.removeEventListener(type, listener);
      });
    }
    this.eventListeners = [];

    // Clear navigation state
    this.isNavigating = false;
    this.history = [];

    // Note: EventBus doesn't have destroy method in current implementation
    // Could add eventBus cleanup here if implemented
  }
}