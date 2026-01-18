// Reddit GDPR Export Data Viewer - Main Application
(function () {
    'use strict';

    // State
    const state = {
        // Content data
        posts: [],
        comments: [],
        messages: [],
        postVotes: [],
        commentVotes: [],
        savedPosts: [],
        savedComments: [],
        hiddenPosts: [],
        statistics: [],
        subscriptions: [],
        preferences: [],

        // Filtered data
        filteredPosts: [],
        filteredComments: [],
        filteredMessages: [],
        filteredPostVotes: [],
        filteredCommentVotes: [],

        // UI state
        currentTab: 'posts',
        currentSubTab: {
            votes: 'post-votes',
            saved: 'saved-posts'
        },

        // Pagination
        postsPage: 1,
        commentsPage: 1,
        messagesPage: 1,
        postVotesPage: 1,
        commentVotesPage: 1,
        itemsPerPage: 25,

        // Sort
        sortField: 'date',
        sortDirection: 'desc',
        searchQuery: '',
        postTypeFilter: 'all', // 'all', 'text', 'link'
        subredditFilter: 'all', // 'all' or specific subreddit name

        // Date range - separate for each content type
        postsDateRange: {
            allDates: [],
            minIndex: 0,
            maxIndex: 100
        },
        commentsDateRange: {
            allDates: [],
            minIndex: 0,
            maxIndex: 100
        },
        messagesDateRange: {
            allDates: [],
            minIndex: 0,
            maxIndex: 100
        },

        // File load status
        filesLoaded: {
            posts: false,
            comments: false,
            messages: false,
            postVotes: false,
            commentVotes: false,
            savedPosts: false,
            savedComments: false,
            hiddenPosts: false,
            statistics: false,
            subscriptions: false,
            preferences: false
        }
    };

    // DOM Elements
    const elements = {
        filePicker: document.getElementById('file-picker'),
        dropZone: document.getElementById('drop-zone'),
        fileInput: document.getElementById('file-input'),
        selectBtn: document.getElementById('select-btn'),
        fileStatus: document.getElementById('file-status'),
        mainApp: document.getElementById('main-app'),
        postsTable: document.querySelector('#posts-table tbody'),
        commentsTable: document.querySelector('#comments-table tbody'),
        messagesTable: document.querySelector('#messages-table tbody'),
        postVotesTable: document.querySelector('#post-votes-table tbody'),
        commentVotesTable: document.querySelector('#comment-votes-table tbody'),
        savedPostsTable: document.querySelector('#saved-posts-table tbody'),
        savedCommentsTable: document.querySelector('#saved-comments-table tbody'),
        hiddenPostsTable: document.querySelector('#hidden-posts-table tbody'),
        postsPagination: document.getElementById('posts-pagination'),
        commentsPagination: document.getElementById('comments-pagination'),
        messagesPagination: document.getElementById('messages-pagination'),
        postVotesPagination: document.getElementById('post-votes-pagination'),
        commentVotesPagination: document.getElementById('comment-votes-pagination'),
        searchInput: document.getElementById('search'),
        stats: document.getElementById('stats'),
        modal: document.getElementById('modal'),
        modalTitle: document.getElementById('modal-title'),
        modalMeta: document.getElementById('modal-meta'),
        modalBody: document.getElementById('modal-body'),
        modalLink: document.getElementById('modal-link'),
        statisticsContent: document.getElementById('statistics-content'),
        subscriptionsContent: document.getElementById('subscriptions-content'),
        preferencesContent: document.getElementById('preferences-content'),
        // Config loader
        loadConfigBtn: document.getElementById('load-config-btn'),
        configFileInput: document.getElementById('config-file-input'),
        configStatus: document.getElementById('config-status'),
        // Filters
        postTypeFilter: document.getElementById('post-type-filter'),
        subredditFilter: document.getElementById('subreddit-filter'),
        // Date range sliders - one per tab
        postsDateRangeContainer: document.getElementById('posts-date-range-container'),
        postsDateMinSlider: document.getElementById('posts-date-min-slider'),
        postsDateMaxSlider: document.getElementById('posts-date-max-slider'),
        postsDateRangeStart: document.getElementById('posts-date-range-start'),
        postsDateRangeEnd: document.getElementById('posts-date-range-end'),
        postsSliderRange: document.getElementById('posts-slider-range'),

        commentsDateRangeContainer: document.getElementById('comments-date-range-container'),
        commentsDateMinSlider: document.getElementById('comments-date-min-slider'),
        commentsDateMaxSlider: document.getElementById('comments-date-max-slider'),
        commentsDateRangeStart: document.getElementById('comments-date-range-start'),
        commentsDateRangeEnd: document.getElementById('comments-date-range-end'),
        commentsSliderRange: document.getElementById('comments-slider-range'),

        messagesDateRangeContainer: document.getElementById('messages-date-range-container'),
        messagesDateMinSlider: document.getElementById('messages-date-min-slider'),
        messagesDateMaxSlider: document.getElementById('messages-date-max-slider'),
        messagesDateRangeStart: document.getElementById('messages-date-range-start'),
        messagesDateRangeEnd: document.getElementById('messages-date-range-end'),
        messagesSliderRange: document.getElementById('messages-slider-range')
    };

    // File type mappings
    const fileTypeMappings = {
        'posts': { stateKey: 'posts', filteredKey: 'filteredPosts' },
        'comments': { stateKey: 'comments', filteredKey: 'filteredComments' },
        'messages': { stateKey: 'messages', filteredKey: 'filteredMessages' },
        'post-votes': { stateKey: 'postVotes', filteredKey: 'filteredPostVotes' },
        'comment-votes': { stateKey: 'commentVotes', filteredKey: 'filteredCommentVotes' },
        'saved-posts': { stateKey: 'savedPosts' },
        'saved-comments': { stateKey: 'savedComments' },
        'hidden-posts': { stateKey: 'hiddenPosts' },
        'statistics': { stateKey: 'statistics' },
        'subscriptions': { stateKey: 'subscriptions' },
        'preferences': { stateKey: 'preferences' }
    };

    // Initialize
    function init() {
        setupFilePickerListeners();
        setupTabUploaders();
        setupConfigLoader();
        setupAppEventListeners();
        setupSubTabListeners();
        render();
        tryAutoLoad();
    }

    // Try to auto-load files from config.json or use defaults
    async function tryAutoLoad() {
        // Type mappings: config key -> internal type
        const typeMap = {
            posts: 'posts',
            comments: 'comments',
            messages: 'messages',
            postVotes: 'post-votes',
            commentVotes: 'comment-votes',
            savedPosts: 'saved-posts',
            savedComments: 'saved-comments',
            hiddenPosts: 'hidden-posts',
            statistics: 'statistics',
            subscriptions: 'subscriptions',
            preferences: 'preferences'
        };

        // Default files if config.json doesn't exist
        const defaultFiles = {
            posts: 'posts.csv',
            comments: 'comments.csv',
            messages: 'messages_archive.csv',
            postVotes: 'post_votes.csv',
            commentVotes: 'comment_votes.csv',
            savedPosts: 'saved_posts.csv',
            savedComments: 'saved_comments.csv',
            hiddenPosts: 'hidden_posts.csv',
            statistics: 'statistics.csv',
            subscriptions: 'subscribed_subreddits.csv',
            preferences: 'user_preferences.csv'
        };

        let filesToLoad = defaultFiles;

        // Try to load config.json
        try {
            const configResponse = await fetch('config.json');
            if (configResponse.ok) {
                const config = await configResponse.json();
                if (config.files) {
                    filesToLoad = config.files;
                    console.log('Loaded file config from config.json');
                }
            }
        } catch (e) {
            console.log('No config.json found, using defaults');
        }

        // Load each file from config
        for (const [key, filename] of Object.entries(filesToLoad)) {
            if (!filename) continue; // Skip empty entries
            const type = typeMap[key];
            if (!type) continue;

            try {
                const response = await fetch(filename, { method: 'HEAD' });
                if (response.ok) {
                    Papa.parse(filename, {
                        download: true,
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => processData(type, results.data)
                    });
                }
            } catch (e) {
                // File not available, skip
            }
        }
    }

    // Process data based on type
    function processData(type, data) {
        const loadedKey = type.replace(/-/g, '') === 'postvotes' ? 'postVotes' :
            type.replace(/-/g, '') === 'commentvotes' ? 'commentVotes' :
                type.replace(/-/g, '') === 'savedposts' ? 'savedPosts' :
                    type.replace(/-/g, '') === 'savedcomments' ? 'savedComments' :
                        type.replace(/-/g, '') === 'hiddenposts' ? 'hiddenPosts' :
                            type;

        switch (type) {
            case 'posts':
                state.posts = data;
                state.filteredPosts = data.filter(p => p.title !== '[deleted by user]');
                state.filesLoaded.posts = true;
                sortData('posts', 'date', 'desc');
                initDateRangeSlider('posts');
                populateSubredditFilter();
                break;
            case 'comments':
                state.comments = data;
                state.filteredComments = [...data];
                state.filesLoaded.comments = true;
                sortData('comments', 'date', 'desc');
                initDateRangeSlider('comments');
                break;
            case 'messages':
                state.messages = data;
                state.filteredMessages = [...data];
                state.filesLoaded.messages = true;
                sortData('messages', 'date', 'desc');
                initDateRangeSlider('messages');
                break;
            case 'post-votes':
                state.postVotes = data;
                state.filteredPostVotes = [...data];
                state.filesLoaded.postVotes = true;
                break;
            case 'comment-votes':
                state.commentVotes = data;
                state.filteredCommentVotes = [...data];
                state.filesLoaded.commentVotes = true;
                break;
            case 'saved-posts':
                state.savedPosts = data;
                state.filesLoaded.savedPosts = true;
                break;
            case 'saved-comments':
                state.savedComments = data;
                state.filesLoaded.savedComments = true;
                break;
            case 'hidden-posts':
                state.hiddenPosts = data;
                state.filesLoaded.hiddenPosts = true;
                break;
            case 'statistics':
                state.statistics = data;
                state.filesLoaded.statistics = true;
                break;
            case 'subscriptions':
                state.subscriptions = data;
                state.filesLoaded.subscriptions = true;
                break;
            case 'preferences':
                state.preferences = data;
                state.filesLoaded.preferences = true;
                break;
        }
        render();
    }

    // Setup config loader button
    function setupConfigLoader() {
        if (elements.loadConfigBtn && elements.configFileInput) {
            elements.loadConfigBtn.addEventListener('click', () => elements.configFileInput.click());
            elements.configFileInput.addEventListener('change', handleConfigFileSelect);
        }
    }

    // Handle config file selection
    function handleConfigFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target.result);
                if (config.files) {
                    loadFilesFromConfig(config.files, file);
                } else {
                    showConfigStatus('Invalid config: no "files" property', 'error');
                }
            } catch (err) {
                showConfigStatus('Error parsing config: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    // Load files based on config, prompting user to select them
    function loadFilesFromConfig(filesConfig, configFile) {
        // Get the directory path from the config file (for display purposes)
        const configPath = configFile.webkitRelativePath || configFile.name;

        // Type mappings
        const typeMap = {
            posts: 'posts',
            comments: 'comments',
            messages: 'messages',
            postVotes: 'post-votes',
            commentVotes: 'comment-votes',
            savedPosts: 'saved-posts',
            savedComments: 'saved-comments',
            hiddenPosts: 'hidden-posts',
            statistics: 'statistics',
            subscriptions: 'subscriptions',
            preferences: 'preferences'
        };

        // Create a file input for selecting multiple files
        const fileNames = Object.values(filesConfig).filter(f => f);
        const fileCount = fileNames.length;

        showConfigStatus(`Config loaded! Now select ${fileCount} CSV files...`, 'success');

        // Create a temporary multi-file input
        const multiInput = document.createElement('input');
        multiInput.type = 'file';
        multiInput.multiple = true;
        multiInput.accept = '.csv';

        multiInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            let loadedCount = 0;

            // Match each file to its config type
            for (const [key, expectedFilename] of Object.entries(filesConfig)) {
                if (!expectedFilename) continue;
                const type = typeMap[key];
                if (!type) continue;

                // Find matching file by name
                const matchedFile = files.find(f =>
                    f.name.toLowerCase() === expectedFilename.toLowerCase()
                );

                if (matchedFile) {
                    parseCSVFile(matchedFile, type);
                    loadedCount++;
                }
            }

            showConfigStatus(`Loaded ${loadedCount} of ${fileCount} files`, loadedCount === fileCount ? 'success' : '');
        };

        // Trigger file selection
        setTimeout(() => multiInput.click(), 100);
    }

    // Show config status message
    function showConfigStatus(message, type) {
        if (elements.configStatus) {
            elements.configStatus.textContent = message;
            elements.configStatus.className = 'config-status ' + (type || '');
        }
    }

    // Setup global file picker
    function setupFilePickerListeners() {
        if (elements.selectBtn) {
            elements.selectBtn.addEventListener('click', () => elements.fileInput.click());
        }
        if (elements.dropZone) {
            elements.dropZone.addEventListener('click', (e) => {
                if (e.target !== elements.selectBtn) elements.fileInput.click();
            });
            elements.dropZone.addEventListener('dragover', handleDragOver);
            elements.dropZone.addEventListener('dragleave', handleDragLeave);
            elements.dropZone.addEventListener('drop', handleDrop);
        }
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', handleFileSelect);
        }
    }

    // Setup tab-specific uploaders
    function setupTabUploaders() {
        const uploaders = [
            { btn: 'posts-select-btn', input: 'posts-file-input', drop: 'posts-drop-zone', type: 'posts' },
            { btn: 'comments-select-btn', input: 'comments-file-input', drop: 'comments-drop-zone', type: 'comments' },
            { btn: 'messages-select-btn', input: 'messages-file-input', drop: 'messages-drop-zone', type: 'messages' },
            { btn: 'post-votes-select-btn', input: 'post-votes-file-input', drop: 'post-votes-drop-zone', type: 'post-votes' },
            { btn: 'comment-votes-select-btn', input: 'comment-votes-file-input', drop: 'comment-votes-drop-zone', type: 'comment-votes' },
            { btn: 'saved-posts-select-btn', input: 'saved-posts-file-input', drop: 'saved-posts-drop-zone', type: 'saved-posts' },
            { btn: 'saved-comments-select-btn', input: 'saved-comments-file-input', drop: 'saved-comments-drop-zone', type: 'saved-comments' },
            { btn: 'hidden-posts-select-btn', input: 'hidden-posts-file-input', drop: 'hidden-posts-drop-zone', type: 'hidden-posts' },
            { btn: 'statistics-select-btn', input: 'statistics-file-input', drop: 'statistics-drop-zone', type: 'statistics' },
            { btn: 'subscriptions-select-btn', input: 'subscriptions-file-input', drop: 'subscriptions-drop-zone', type: 'subscriptions' },
            { btn: 'preferences-select-btn', input: 'preferences-file-input', drop: 'preferences-drop-zone', type: 'preferences' }
        ];

        uploaders.forEach(({ btn, input, drop, type }) => {
            const btnEl = document.getElementById(btn);
            const inputEl = document.getElementById(input);
            const dropEl = document.getElementById(drop);

            if (btnEl && inputEl) {
                btnEl.addEventListener('click', (e) => { e.stopPropagation(); inputEl.click(); });
                inputEl.addEventListener('change', (e) => parseCSVFile(e.target.files[0], type));
            }
            if (dropEl) {
                dropEl.addEventListener('click', () => inputEl?.click());
                dropEl.addEventListener('dragover', handleDragOver);
                dropEl.addEventListener('dragleave', handleDragLeave);
                dropEl.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropEl.classList.remove('drag-over');
                    if (e.dataTransfer.files.length > 0) parseCSVFile(e.dataTransfer.files[0], type);
                });
            }
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    }

    function handleFileSelect(e) {
        handleFiles(e.target.files);
    }

    // Process files (global picker)
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            const fileName = file.name.toLowerCase();
            if (fileName.includes('post_votes')) parseCSVFile(file, 'post-votes');
            else if (fileName.includes('comment_votes')) parseCSVFile(file, 'comment-votes');
            else if (fileName.includes('saved_posts')) parseCSVFile(file, 'saved-posts');
            else if (fileName.includes('saved_comments')) parseCSVFile(file, 'saved-comments');
            else if (fileName.includes('hidden_posts')) parseCSVFile(file, 'hidden-posts');
            else if (fileName.includes('messages_archive')) parseCSVFile(file, 'messages');
            else if (fileName.includes('subscribed_subreddits')) parseCSVFile(file, 'subscriptions');
            else if (fileName.includes('user_preferences')) parseCSVFile(file, 'preferences');
            else if (fileName.includes('statistics')) parseCSVFile(file, 'statistics');
            else if (fileName.includes('post')) parseCSVFile(file, 'posts');
            else if (fileName.includes('comment')) parseCSVFile(file, 'comments');
        });
    }

    // Parse CSV file
    function parseCSVFile(file, type) {
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => processData(type, results.data),
            error: (error) => {
                console.error(`Error parsing ${type}:`, error);
                alert(`Error loading ${file.name}`);
            }
        });
    }

    // Setup app event listeners
    function setupAppEventListeners() {
        // Main tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });

        // Search
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
        }

        // Sort
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => handleSort(th.dataset.sort));
        });

        // Post type filter
        if (elements.postTypeFilter) {
            elements.postTypeFilter.addEventListener('change', handlePostTypeFilter);
        }

        // Subreddit filter
        if (elements.subredditFilter) {
            elements.subredditFilter.addEventListener('change', handleSubredditFilter);
        }

        // Posts date range sliders
        if (elements.postsDateMinSlider && elements.postsDateMaxSlider) {
            elements.postsDateMinSlider.addEventListener('input', () => handleDateRangeChange('posts'));
            elements.postsDateMaxSlider.addEventListener('input', () => handleDateRangeChange('posts'));
        }

        // Comments date range sliders
        if (elements.commentsDateMinSlider && elements.commentsDateMaxSlider) {
            elements.commentsDateMinSlider.addEventListener('input', () => handleDateRangeChange('comments'));
            elements.commentsDateMaxSlider.addEventListener('input', () => handleDateRangeChange('comments'));
        }

        // Messages date range sliders
        if (elements.messagesDateMinSlider && elements.messagesDateMaxSlider) {
            elements.messagesDateMinSlider.addEventListener('input', () => handleDateRangeChange('messages'));
            elements.messagesDateMaxSlider.addEventListener('input', () => handleDateRangeChange('messages'));
        }

        // Modal
        document.querySelector('.close')?.addEventListener('click', closeModal);
        elements.modal?.addEventListener('click', (e) => { if (e.target === elements.modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }

    // Populate subreddit filter based on loaded posts
    function populateSubredditFilter() {
        if (!state.posts.length || !elements.subredditFilter) return;

        // Get unique subreddits sorted alphabetically
        const subreddits = [...new Set(
            state.posts
                .filter(p => p.subreddit && p.title !== '[deleted by user]')
                .map(p => p.subreddit)
        )].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

        if (subreddits.length === 0) return;

        // Clear and repopulate
        elements.subredditFilter.innerHTML = '<option value="all">All Subreddits (' + subreddits.length + ')</option>';
        subreddits.forEach(sub => {
            const count = state.posts.filter(p => p.subreddit === sub && p.title !== '[deleted by user]').length;
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = `r/${sub} (${count})`;
            elements.subredditFilter.appendChild(option);
        });

        // Show the filter
        elements.subredditFilter.style.display = 'block';
    }

    // Handle subreddit filter change
    function handleSubredditFilter() {
        state.subredditFilter = elements.subredditFilter.value;
        state.postsPage = 1;
        applyFilters();
    }

    // Initialize date range slider for a specific content type
    function initDateRangeSlider(type) {
        // Get element references based on type
        const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
        const containerEl = elements[`${type}DateRangeContainer`];
        const minSliderEl = elements[`${type}DateMinSlider`];
        const maxSliderEl = elements[`${type}DateMaxSlider`];
        const dateRangeState = state[`${type}DateRange`];

        if (!containerEl || !minSliderEl || !maxSliderEl || !dateRangeState) return;

        // Collect timestamps only from this content type
        let sourceData = [];
        if (type === 'posts') {
            sourceData = state.posts.filter(p => p.date && p.title !== '[deleted by user]');
        } else if (type === 'comments') {
            sourceData = state.comments.filter(c => c.date);
        } else if (type === 'messages') {
            sourceData = state.messages.filter(m => m.date);
        }

        const allDates = sourceData.map(item => new Date(item.date).getTime());

        // Filter valid dates and sort
        const dates = allDates
            .filter(d => !isNaN(d))
            .sort((a, b) => a - b);

        if (dates.length < 2) {
            containerEl.style.display = 'none';
            return;
        }

        // Store unique sorted dates
        dateRangeState.allDates = [...new Set(dates)];
        dateRangeState.minIndex = 0;
        dateRangeState.maxIndex = 100;

        // Show the slider
        containerEl.style.display = 'block';

        // Reset sliders
        minSliderEl.value = 0;
        maxSliderEl.value = 100;

        // Update labels and visual
        updateDateRangeLabels(type);
        updateSliderVisual(type);
    }

    // Handle date range slider change for a specific type
    function handleDateRangeChange(type) {
        const minSliderEl = elements[`${type}DateMinSlider`];
        const maxSliderEl = elements[`${type}DateMaxSlider`];
        const dateRangeState = state[`${type}DateRange`];

        if (!minSliderEl || !maxSliderEl || !dateRangeState) return;

        let minVal = parseInt(minSliderEl.value);
        let maxVal = parseInt(maxSliderEl.value);

        // Prevent crossing
        if (minVal > maxVal - 5) {
            if (document.activeElement === minSliderEl) {
                minVal = maxVal - 5;
                minSliderEl.value = minVal;
            } else {
                maxVal = minVal + 5;
                maxSliderEl.value = maxVal;
            }
        }

        dateRangeState.minIndex = minVal;
        dateRangeState.maxIndex = maxVal;

        updateDateRangeLabels(type);
        updateSliderVisual(type);

        // Reset appropriate page
        if (type === 'posts') state.postsPage = 1;
        else if (type === 'comments') state.commentsPage = 1;
        else if (type === 'messages') state.messagesPage = 1;

        applyFilters();
    }

    // Update date labels for a specific type
    function updateDateRangeLabels(type) {
        const dateRangeState = state[`${type}DateRange`];
        const startEl = elements[`${type}DateRangeStart`];
        const endEl = elements[`${type}DateRangeEnd`];

        if (!dateRangeState || !startEl || !endEl) return;

        const dates = dateRangeState.allDates;
        if (!dates.length) return;

        const minIdx = Math.floor((dateRangeState.minIndex / 100) * (dates.length - 1));
        const maxIdx = Math.floor((dateRangeState.maxIndex / 100) * (dates.length - 1));

        const minDate = new Date(dates[minIdx]);
        const maxDate = new Date(dates[maxIdx]);

        const formatDate = (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

        startEl.textContent = formatDate(minDate);
        endEl.textContent = formatDate(maxDate);
    }

    // Update slider track visual for a specific type
    function updateSliderVisual(type) {
        const dateRangeState = state[`${type}DateRange`];
        const sliderRangeEl = elements[`${type}SliderRange`];

        if (!dateRangeState || !sliderRangeEl) return;

        const minVal = dateRangeState.minIndex;
        const maxVal = dateRangeState.maxIndex;

        sliderRangeEl.style.left = minVal + '%';
        sliderRangeEl.style.width = (maxVal - minVal) + '%';
    }

    // Setup sub-tab listeners
    function setupSubTabListeners() {
        document.querySelectorAll('.sub-tab').forEach(subTab => {
            subTab.addEventListener('click', () => {
                const subtabId = subTab.dataset.subtab;
                const parentTab = subTab.closest('.tab-content').id.replace('-tab', '');

                // Update button states
                subTab.parentElement.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
                subTab.classList.add('active');

                // Update content visibility
                const parentContent = subTab.closest('.tab-content');
                parentContent.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`${subtabId}-subtab`)?.classList.add('active');

                // Update state
                state.currentSubTab[parentTab] = subtabId;
                updateStats();
            });
        });
    }

    // Switch tabs
    function switchTab(tabName) {
        state.currentTab = tabName;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        updateStats();

        // Manage visibility of global controls and filters
        const hideGlobalControls = ['votes', 'saved', 'account', 'settings'].includes(tabName);
        const controls = document.querySelector('.controls');

        if (controls) {
            controls.style.display = hideGlobalControls ? 'none' : 'flex';
        }
    }

    // Handle search
    function handleSearch() {
        state.searchQuery = elements.searchInput.value.toLowerCase().trim();
        applyFilters();
    }

    // Handle post type filter
    function handlePostTypeFilter() {
        state.postTypeFilter = elements.postTypeFilter.value;
        state.postsPage = 1;
        applyFilters();
    }

    // Apply all filters (search + post type)
    function applyFilters() {
        state.postsPage = 1;
        state.commentsPage = 1;
        state.messagesPage = 1;
        state.postVotesPage = 1;
        state.commentVotesPage = 1;

        // Start with base posts (excluding deleted)
        let filteredPosts = state.posts.filter(p => p.title !== '[deleted by user]');

        // Apply post type filter
        if (state.postTypeFilter === 'text') {
            // Text posts: have body content OR url points to self/reddit
            filteredPosts = filteredPosts.filter(post => {
                const hasBody = post.body && post.body.trim().length > 0;
                const isSelfPost = !post.url || post.url.includes('reddit.com') || post.url.startsWith('/r/');
                return hasBody || isSelfPost;
            });
        } else if (state.postTypeFilter === 'link') {
            // Link posts: have external URL and no/minimal body
            filteredPosts = filteredPosts.filter(post => {
                const hasExternalUrl = post.url && !post.url.includes('reddit.com') && !post.url.startsWith('/r/');
                return hasExternalUrl;
            });
        }

        // Apply subreddit filter
        if (state.subredditFilter !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.subreddit === state.subredditFilter);
        }

        // Apply posts date range filter (using posts-specific slider)
        const postsDateRangeActive = state.postsDateRange.allDates.length >= 2;
        if (postsDateRangeActive) {
            const dates = state.postsDateRange.allDates;
            const minIdx = Math.floor((state.postsDateRange.minIndex / 100) * (dates.length - 1));
            const maxIdx = Math.floor((state.postsDateRange.maxIndex / 100) * (dates.length - 1));
            const minDate = dates[minIdx];
            const maxDate = dates[maxIdx];

            filteredPosts = filteredPosts.filter(post => {
                const postDate = new Date(post.date).getTime();
                return !isNaN(postDate) && postDate >= minDate && postDate <= maxDate;
            });
        }

        // Apply search filter to posts
        if (state.searchQuery) {
            filteredPosts = filteredPosts.filter(post =>
                (post.subreddit?.toLowerCase().includes(state.searchQuery)) ||
                (post.title?.toLowerCase().includes(state.searchQuery)) ||
                (post.body?.toLowerCase().includes(state.searchQuery))
            );

            state.filteredComments = state.comments.filter(comment =>
                (comment.subreddit?.toLowerCase().includes(state.searchQuery)) ||
                (comment.body?.toLowerCase().includes(state.searchQuery))
            );
            state.filteredMessages = state.messages.filter(msg =>
                (msg.from?.toLowerCase().includes(state.searchQuery)) ||
                (msg.to?.toLowerCase().includes(state.searchQuery)) ||
                (msg.subject?.toLowerCase().includes(state.searchQuery)) ||
                (msg.body?.toLowerCase().includes(state.searchQuery))
            );
            state.filteredPostVotes = state.postVotes.filter(vote =>
                (vote.permalink?.toLowerCase().includes(state.searchQuery))
            );
            state.filteredCommentVotes = state.commentVotes.filter(vote =>
                (vote.permalink?.toLowerCase().includes(state.searchQuery))
            );
        } else {
            state.filteredComments = [...state.comments];
            state.filteredMessages = [...state.messages];
            state.filteredPostVotes = [...state.postVotes];
            state.filteredCommentVotes = [...state.commentVotes];
        }

        // Apply comments date range filter (using comments-specific slider)
        const commentsDateRangeActive = state.commentsDateRange.allDates.length >= 2;
        if (commentsDateRangeActive) {
            const dates = state.commentsDateRange.allDates;
            const minIdx = Math.floor((state.commentsDateRange.minIndex / 100) * (dates.length - 1));
            const maxIdx = Math.floor((state.commentsDateRange.maxIndex / 100) * (dates.length - 1));
            const minDate = dates[minIdx];
            const maxDate = dates[maxIdx];

            state.filteredComments = state.filteredComments.filter(item => {
                const itemDate = new Date(item.date).getTime();
                return !isNaN(itemDate) && itemDate >= minDate && itemDate <= maxDate;
            });
        }

        // Apply messages date range filter (using messages-specific slider)
        const messagesDateRangeActive = state.messagesDateRange.allDates.length >= 2;
        if (messagesDateRangeActive) {
            const dates = state.messagesDateRange.allDates;
            const minIdx = Math.floor((state.messagesDateRange.minIndex / 100) * (dates.length - 1));
            const maxIdx = Math.floor((state.messagesDateRange.maxIndex / 100) * (dates.length - 1));
            const minDate = dates[minIdx];
            const maxDate = dates[maxIdx];

            state.filteredMessages = state.filteredMessages.filter(item => {
                const itemDate = new Date(item.date).getTime();
                return !isNaN(itemDate) && itemDate >= minDate && itemDate <= maxDate;
            });
        }

        state.filteredPosts = filteredPosts;
        render();
    }

    // Handle sort
    function handleSort(field) {
        if (state.sortField === field) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortField = field;
            state.sortDirection = 'desc';
        }
        sortData(state.currentTab, field, state.sortDirection);
        render();
    }

    // Sort data
    function sortData(dataType, field, direction) {
        const dataMap = {
            posts: state.filteredPosts,
            comments: state.filteredComments,
            messages: state.filteredMessages
        };
        const data = dataMap[dataType];
        if (!data) return;

        data.sort((a, b) => {
            let valA = a[field] || '';
            let valB = b[field] || '';
            if (field === 'date') {
                valA = new Date(valA).getTime() || 0;
                valB = new Date(valB).getTime() || 0;
            } else {
                valA = valA.toString().toLowerCase();
                valB = valB.toString().toLowerCase();
            }
            return direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
    }

    // Main render
    function render() {
        updateTabVisibility();
        if (state.filesLoaded.posts) renderPosts();
        if (state.filesLoaded.comments) renderComments();
        if (state.filesLoaded.messages) renderMessages();
        if (state.filesLoaded.postVotes) renderPostVotes();
        if (state.filesLoaded.commentVotes) renderCommentVotes();
        if (state.filesLoaded.savedPosts) renderSavedPosts();
        if (state.filesLoaded.savedComments) renderSavedComments();
        if (state.filesLoaded.hiddenPosts) renderHiddenPosts();
        if (state.filesLoaded.statistics) renderStatistics();
        if (state.filesLoaded.subscriptions) renderSubscriptions();
        if (state.filesLoaded.preferences) renderPreferences();
        updateStats();
    }

    function updateTabVisibility() {
        // Posts
        toggleView('posts', state.filesLoaded.posts);
        // Comments
        toggleView('comments', state.filesLoaded.comments);
        // Messages
        toggleView('messages', state.filesLoaded.messages);
        // Post Votes
        toggleView('post-votes', state.filesLoaded.postVotes);
        // Comment Votes
        toggleView('comment-votes', state.filesLoaded.commentVotes);
        // Saved Posts
        toggleView('saved-posts', state.filesLoaded.savedPosts);
        // Saved Comments
        toggleView('saved-comments', state.filesLoaded.savedComments);
        // Hidden Posts
        toggleView('hidden-posts', state.filesLoaded.hiddenPosts);
    }

    function toggleView(type, loaded) {
        const uploader = document.getElementById(`${type}-uploader`);
        const view = document.getElementById(`${type}-view`);
        if (uploader && view) {
            if (loaded) {
                uploader.classList.add('hidden');
                view.classList.remove('hidden');
            } else {
                uploader.classList.remove('hidden');
                view.classList.add('hidden');
            }
        }
    }

    // Render Posts
    function renderPosts() {
        const start = (state.postsPage - 1) * state.itemsPerPage;
        const pageData = state.filteredPosts.slice(start, start + state.itemsPerPage);

        if (pageData.length === 0) {
            elements.postsTable.innerHTML = '<tr><td colspan="3" class="empty-state">No posts found</td></tr>';
            elements.postsPagination.innerHTML = '';
            return;
        }

        elements.postsTable.innerHTML = pageData.map((post, index) => `
            <tr data-type="post" data-index="${start + index}" data-id="${post.id || ''}">
                <td><span class="date">${formatDate(post.date)}</span></td>
                <td><span class="subreddit">r/${escapeHtml(post.subreddit || 'unknown')}</span></td>
                <td>
                    <div class="title">${escapeHtml(post.title || '(no title)')}</div>
                    ${post.body ? `<div class="preview">${escapeHtml(truncate(post.body, 150))}</div>` : ''}
                </td>
                <td class="actions-col">
                    <button class="delete-btn" data-id="${post.id || ''}" title="Delete post">🗑️</button>
                </td>
            </tr>
        `).join('');

        // Attach row click handlers (for modal) - exclude delete button clicks
        elements.postsTable.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.delete-btn')) return; // Don't open modal if delete clicked
                openModal('post', parseInt(row.dataset.index));
            });
        });

        // Attach delete button handlers
        elements.postsTable.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.id;
                if (postId && confirm('Delete this post permanently?')) {
                    deletePost(postId);
                }
            });
        });

        renderPagination('posts', state.filteredPosts.length);
    }

    // Render Comments
    function renderComments() {
        const start = (state.commentsPage - 1) * state.itemsPerPage;
        const pageData = state.filteredComments.slice(start, start + state.itemsPerPage);

        if (pageData.length === 0) {
            elements.commentsTable.innerHTML = '<tr><td colspan="3" class="empty-state">No comments found</td></tr>';
            elements.commentsPagination.innerHTML = '';
            return;
        }

        elements.commentsTable.innerHTML = pageData.map((comment, index) => `
            <tr data-type="comment" data-index="${start + index}">
                <td><span class="date">${formatDate(comment.date)}</span></td>
                <td><span class="subreddit">r/${escapeHtml(comment.subreddit || 'unknown')}</span></td>
                <td><div class="preview">${escapeHtml(truncate(comment.body || '', 200))}</div></td>
            </tr>
        `).join('');

        elements.commentsTable.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', () => openModal('comment', parseInt(row.dataset.index)));
        });

        renderPagination('comments', state.filteredComments.length);
    }

    // Render Messages
    function renderMessages() {
        const start = (state.messagesPage - 1) * state.itemsPerPage;
        const pageData = state.filteredMessages.slice(start, start + state.itemsPerPage);

        if (pageData.length === 0) {
            elements.messagesTable.innerHTML = '<tr><td colspan="4" class="empty-state">No messages found</td></tr>';
            elements.messagesPagination.innerHTML = '';
            return;
        }

        elements.messagesTable.innerHTML = pageData.map((msg, index) => `
            <tr data-type="message" data-index="${start + index}">
                <td><span class="date">${formatDate(msg.date)}</span></td>
                <td>${escapeHtml(msg.from || 'unknown')}</td>
                <td>${escapeHtml(msg.to || 'unknown')}</td>
                <td><div class="title">${escapeHtml(truncate(msg.subject || '(no subject)', 60))}</div></td>
            </tr>
        `).join('');

        elements.messagesTable.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', () => openModal('message', parseInt(row.dataset.index)));
        });

        renderPagination('messages', state.filteredMessages.length);
    }

    // Render Post Votes
    function renderPostVotes() {
        const start = (state.postVotesPage - 1) * state.itemsPerPage;
        const pageData = state.filteredPostVotes.slice(start, start + state.itemsPerPage);

        if (pageData.length === 0) {
            elements.postVotesTable.innerHTML = '<tr><td colspan="2" class="empty-state">No post votes found</td></tr>';
            elements.postVotesPagination.innerHTML = '';
            return;
        }

        elements.postVotesTable.innerHTML = pageData.map(vote => `
            <tr>
                <td><span class="${vote.direction === 'up' ? 'vote-up' : 'vote-down'}">${vote.direction === 'up' ? 'Upvoted' : 'Downvoted'}</span></td>
                <td><a href="${escapeHtml(vote.permalink || '#')}" target="_blank" class="table-link">${escapeHtml(truncate(vote.permalink || '', 80))}</a></td>
            </tr>
        `).join('');

        renderPagination('post-votes', state.filteredPostVotes.length);
    }

    // Render Comment Votes
    function renderCommentVotes() {
        const start = (state.commentVotesPage - 1) * state.itemsPerPage;
        const pageData = state.filteredCommentVotes.slice(start, start + state.itemsPerPage);

        if (pageData.length === 0) {
            elements.commentVotesTable.innerHTML = '<tr><td colspan="2" class="empty-state">No comment votes found</td></tr>';
            elements.commentVotesPagination.innerHTML = '';
            return;
        }

        elements.commentVotesTable.innerHTML = pageData.map(vote => `
            <tr>
                <td><span class="${vote.direction === 'up' ? 'vote-up' : 'vote-down'}">${vote.direction === 'up' ? 'Upvoted' : 'Downvoted'}</span></td>
                <td><a href="${escapeHtml(vote.permalink || '#')}" target="_blank" class="table-link">${escapeHtml(truncate(vote.permalink || '', 80))}</a></td>
            </tr>
        `).join('');

        renderPagination('comment-votes', state.filteredCommentVotes.length);
    }

    // Render Saved Posts
    function renderSavedPosts() {
        if (state.savedPosts.length === 0) {
            elements.savedPostsTable.innerHTML = '<tr><td colspan="2" class="empty-state">No saved posts found</td></tr>';
            return;
        }

        elements.savedPostsTable.innerHTML = state.savedPosts.map(post => `
            <tr>
                <td>${escapeHtml(post.id || '')}</td>
                <td><a href="${escapeHtml(post.permalink || '#')}" target="_blank" class="table-link">${escapeHtml(post.permalink || '')}</a></td>
            </tr>
        `).join('');
    }

    // Render Saved Comments
    function renderSavedComments() {
        if (state.savedComments.length === 0) {
            elements.savedCommentsTable.innerHTML = '<tr><td colspan="2" class="empty-state">No saved comments found</td></tr>';
            return;
        }

        elements.savedCommentsTable.innerHTML = state.savedComments.map(comment => `
            <tr>
                <td>${escapeHtml(comment.id || '')}</td>
                <td><a href="${escapeHtml(comment.permalink || '#')}" target="_blank" class="table-link">${escapeHtml(comment.permalink || '')}</a></td>
            </tr>
        `).join('');
    }

    // Render Hidden Posts
    function renderHiddenPosts() {
        if (state.hiddenPosts.length === 0) {
            elements.hiddenPostsTable.innerHTML = '<tr><td colspan="2" class="empty-state">No hidden posts found</td></tr>';
            return;
        }

        elements.hiddenPostsTable.innerHTML = state.hiddenPosts.map(post => `
            <tr>
                <td>${escapeHtml(post.id || '')}</td>
                <td><a href="${escapeHtml(post.permalink || '#')}" target="_blank" class="table-link">${escapeHtml(post.permalink || '')}</a></td>
            </tr>
        `).join('');
    }

    // Render Statistics
    function renderStatistics() {
        if (!elements.statisticsContent) return;

        const statsHtml = `
            <div class="stats-grid">
                ${state.statistics.map(stat => `
                    <div class="stat-item">
                        <div class="stat-label">${escapeHtml(stat.statistic || '')}</div>
                        <div class="stat-value">${escapeHtml(stat.value || '')}</div>
                    </div>
                `).join('')}
            </div>
        `;
        elements.statisticsContent.innerHTML = statsHtml;
    }

    // Render Subscriptions
    function renderSubscriptions() {
        if (!elements.subscriptionsContent) return;

        const subsHtml = `
            <div class="subreddit-list">
                ${state.subscriptions.map(sub => `
                    <span class="subreddit-tag">r/${escapeHtml(sub.subreddit || '')}</span>
                `).join('')}
            </div>
        `;
        elements.subscriptionsContent.innerHTML = subsHtml;
    }

    // Render Preferences
    function renderPreferences() {
        if (!elements.preferencesContent) return;

        const prefsHtml = `
            <table class="preferences-table">
                ${state.preferences.map(pref => `
                    <tr>
                        <td>${escapeHtml(pref.preference || '')}</td>
                        <td>${escapeHtml(pref.value || '')}</td>
                    </tr>
                `).join('')}
            </table>
        `;
        elements.preferencesContent.innerHTML = prefsHtml;
    }

    // Render pagination
    function renderPagination(type, totalItems) {
        const containerMap = {
            'posts': elements.postsPagination,
            'comments': elements.commentsPagination,
            'messages': elements.messagesPagination,
            'post-votes': elements.postVotesPagination,
            'comment-votes': elements.commentVotesPagination
        };
        const pageMap = {
            'posts': 'postsPage',
            'comments': 'commentsPage',
            'messages': 'messagesPage',
            'post-votes': 'postVotesPage',
            'comment-votes': 'commentVotesPage'
        };

        const container = containerMap[type];
        const pageKey = pageMap[type];
        if (!container || !pageKey) return;

        const currentPage = state[pageKey];
        const totalPages = Math.ceil(totalItems / state.itemsPerPage);

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">← Prev</button>`;
        const pages = getPageNumbers(currentPage, totalPages);
        pages.forEach(page => {
            if (page === '...') {
                html += `<span style="padding: 0.5rem;">...</span>`;
            } else {
                html += `<button class="${page === currentPage ? 'active' : ''}" data-page="${page}">${page}</button>`;
            }
        });
        html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next →</button>`;

        container.innerHTML = html;

        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                state[pageKey] = page;
                render();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    function getPageNumbers(current, total) {
        const pages = [];
        const delta = 2;
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }
        return pages;
    }

    // Open modal
    function openModal(type, index) {
        let data;
        if (type === 'post') data = state.filteredPosts[index];
        else if (type === 'comment') data = state.filteredComments[index];
        else if (type === 'message') data = state.filteredMessages[index];
        if (!data) return;

        if (type === 'post') {
            elements.modalTitle.textContent = data.title || '(no title)';
            elements.modalMeta.innerHTML = `
                <span class="subreddit">r/${escapeHtml(data.subreddit || 'unknown')}</span>
                <span class="date">${formatDate(data.date)}</span>
            `;
            elements.modalBody.textContent = data.body || '(no content)';
        } else if (type === 'comment') {
            elements.modalTitle.textContent = 'Comment';
            elements.modalMeta.innerHTML = `
                <span class="subreddit">r/${escapeHtml(data.subreddit || 'unknown')}</span>
                <span class="date">${formatDate(data.date)}</span>
            `;
            elements.modalBody.textContent = data.body || '(no content)';
        } else if (type === 'message') {
            elements.modalTitle.textContent = data.subject || '(no subject)';
            elements.modalMeta.innerHTML = `
                <span>From: ${escapeHtml(data.from || 'unknown')}</span>
                <span>To: ${escapeHtml(data.to || 'unknown')}</span>
                <span class="date">${formatDate(data.date)}</span>
            `;
            elements.modalBody.textContent = data.body || '(no content)';
        }

        const permalink = data.permalink || '';
        if (permalink) {
            const url = permalink.startsWith('http') ? permalink : `https://reddit.com${permalink}`;
            elements.modalLink.href = url;
            elements.modalLink.style.display = 'inline-block';
        } else {
            elements.modalLink.style.display = 'none';
        }

        elements.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        elements.modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Update stats
    function updateStats() {
        let count = 0, total = 0, label = '';

        switch (state.currentTab) {
            case 'posts':
                count = state.filteredPosts.length;
                total = state.posts.length;
                label = 'posts';
                break;
            case 'comments':
                count = state.filteredComments.length;
                total = state.comments.length;
                label = 'comments';
                break;
            case 'messages':
                count = state.filteredMessages.length;
                total = state.messages.length;
                label = 'messages';
                break;
            case 'votes':
                if (state.currentSubTab.votes === 'post-votes') {
                    count = state.filteredPostVotes.length;
                    total = state.postVotes.length;
                    label = 'post votes';
                } else {
                    count = state.filteredCommentVotes.length;
                    total = state.commentVotes.length;
                    label = 'comment votes';
                }
                break;
            case 'saved':
                if (state.currentSubTab.saved === 'saved-posts') {
                    total = state.savedPosts.length;
                    label = 'saved posts';
                } else if (state.currentSubTab.saved === 'saved-comments') {
                    total = state.savedComments.length;
                    label = 'saved comments';
                } else {
                    total = state.hiddenPosts.length;
                    label = 'hidden posts';
                }
                count = total;
                break;
            case 'account':
                label = 'account info';
                break;
        }

        if (state.searchQuery && count !== total) {
            elements.stats.textContent = `${count} of ${total} ${label}`;
        } else if (total > 0) {
            elements.stats.textContent = `${total} ${label}`;
        } else {
            elements.stats.textContent = '';
        }
    }

    // Utilities
    function formatDate(dateStr) {
        if (!dateStr) return 'Unknown';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch { return dateStr; }
    }

    function truncate(str, maxLength) {
        if (!str) return '';
        return str.length <= maxLength ? str : str.substring(0, maxLength) + '...';
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Server status
    let serverAvailable = false;

    // Check if server is running
    async function checkServerStatus() {
        try {
            const response = await fetch('/api/status');
            if (response.ok) {
                serverAvailable = true;
                console.log('Server detected - delete functionality enabled');
            }
        } catch (e) {
            serverAvailable = false;
            console.log('No server detected - delete requires server.js');
        }
    }

    // Delete a post via server API
    async function deletePost(postId) {
        if (!serverAvailable) {
            alert('Delete requires the server. Run: node server.js');
            return;
        }

        try {
            const response = await fetch('/api/delete-row', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: 'posts.csv', rowId: postId })
            });

            const result = await response.json();

            if (result.success) {
                // Remove from state
                state.posts = state.posts.filter(p => p.id !== postId);
                state.filteredPosts = state.filteredPosts.filter(p => p.id !== postId);

                // Re-render
                render();
                updateStats();

                console.log(`Post ${postId} deleted`);
            } else {
                alert('Delete failed: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    }

    // Settings tab elements
    const settingsElements = {
        serverStatus: document.getElementById('server-status-indicator'),
        apiKeyInput: document.getElementById('poe-api-key'),
        apiKeyStatus: document.getElementById('api-key-status'),
        modelSelect: document.getElementById('poe-model'),
        aiSummarize: document.getElementById('ai-summarize'),
        aiInsights: document.getElementById('ai-insights'),
        aiChat: document.getElementById('ai-chat'),
        aiOutput: document.getElementById('ai-output')
    };

    // API key validation timeout
    let apiKeyValidationTimeout = null;

    // Setup settings listeners
    function setupSettingsListeners() {
        // Load saved API key and fetch models
        const savedKey = localStorage.getItem('poe_api_key');
        if (savedKey && settingsElements.apiKeyInput) {
            settingsElements.apiKeyInput.value = savedKey;
            // Fetch models with saved key
            if (serverAvailable) {
                fetchAvailableModels(savedKey);
            }
        }

        // Auto-save API key on input/paste with debounce
        if (settingsElements.apiKeyInput) {
            settingsElements.apiKeyInput.addEventListener('input', () => {
                clearTimeout(apiKeyValidationTimeout);
                const key = settingsElements.apiKeyInput.value.trim();

                if (key.length > 10) { // Minimum key length
                    // Show loading
                    if (settingsElements.apiKeyStatus) {
                        settingsElements.apiKeyStatus.className = 'api-status loading';
                        settingsElements.apiKeyStatus.textContent = 'Validating...';
                    }

                    // Debounce validation
                    apiKeyValidationTimeout = setTimeout(() => {
                        validateAndSaveApiKey(key);
                    }, 500);
                } else {
                    // Clear if key is removed
                    if (settingsElements.apiKeyStatus) {
                        settingsElements.apiKeyStatus.className = 'api-status';
                        settingsElements.apiKeyStatus.textContent = '';
                    }
                    settingsElements.modelSelect.innerHTML = '<option value="">-- Enter API key first --</option>';
                    settingsElements.modelSelect.disabled = true;
                    updateAiFeatureState();
                }
            });
        }

        // Save model selection
        if (settingsElements.modelSelect) {
            settingsElements.modelSelect.addEventListener('change', () => {
                if (settingsElements.modelSelect.value) {
                    localStorage.setItem('poe_model', settingsElements.modelSelect.value);
                }
            });
        }

        // AI feature buttons
        if (settingsElements.aiSummarize) {
            settingsElements.aiSummarize.addEventListener('click', () => runAiFeature('summarize'));
        }
        if (settingsElements.aiInsights) {
            settingsElements.aiInsights.addEventListener('click', () => runAiFeature('insights'));
        }
        if (settingsElements.aiChat) {
            settingsElements.aiChat.addEventListener('click', () => runAiFeature('chat'));
        }

        // Initial AI feature state
        updateAiFeatureState();
    }

    // Validate API key and save if valid
    async function validateAndSaveApiKey(key) {
        if (!serverAvailable) {
            if (settingsElements.apiKeyStatus) {
                settingsElements.apiKeyStatus.className = 'api-status error';
                settingsElements.apiKeyStatus.textContent = 'Server offline';
            }
            return;
        }

        try {
            const response = await fetch('/api/poe/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: key })
            });

            const result = await response.json();

            if (result.success && result.models) {
                // Valid key - save it
                localStorage.setItem('poe_api_key', key);

                if (settingsElements.apiKeyStatus) {
                    settingsElements.apiKeyStatus.className = 'api-status';
                    settingsElements.apiKeyStatus.textContent = '';
                }

                // Populate models
                populateModelDropdown(result.models);
            } else {
                if (settingsElements.apiKeyStatus) {
                    settingsElements.apiKeyStatus.className = 'api-status error';
                    settingsElements.apiKeyStatus.textContent = '✗ Invalid';
                }
                settingsElements.modelSelect.innerHTML = '<option value="">-- Invalid API key --</option>';
                settingsElements.modelSelect.disabled = true;
            }
        } catch (err) {
            if (settingsElements.apiKeyStatus) {
                settingsElements.apiKeyStatus.className = 'api-status error';
                settingsElements.apiKeyStatus.textContent = 'Error';
            }
        }

        updateAiFeatureState();
    }

    // Fetch available models from Poe API
    async function fetchAvailableModels(apiKey) {
        if (!serverAvailable || !apiKey) return;

        try {
            const response = await fetch('/api/poe/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey })
            });

            const result = await response.json();

            if (result.success && result.models) {
                if (settingsElements.apiKeyStatus) {
                    settingsElements.apiKeyStatus.className = 'api-status';
                    settingsElements.apiKeyStatus.textContent = '';
                }
                populateModelDropdown(result.models);
            }
        } catch (err) {
            console.error('Failed to fetch models:', err);
        }
    }

    // Populate model dropdown
    function populateModelDropdown(models) {
        if (!settingsElements.modelSelect) return;

        const savedModel = localStorage.getItem('poe_model');

        // Sort models: popular ones first, then alphabetically
        const popularModels = ['GPT-4o', 'GPT-4o-Mini', 'Claude-3.5-Sonnet', 'Claude-3-Haiku', 'Gemini-2.0-Flash'];
        models.sort((a, b) => {
            const aPopular = popularModels.findIndex(m => a.id.toLowerCase().includes(m.toLowerCase()));
            const bPopular = popularModels.findIndex(m => b.id.toLowerCase().includes(m.toLowerCase()));
            if (aPopular >= 0 && bPopular < 0) return -1;
            if (bPopular >= 0 && aPopular < 0) return 1;
            if (aPopular >= 0 && bPopular >= 0) return aPopular - bPopular;
            return a.name.localeCompare(b.name);
        });

        settingsElements.modelSelect.innerHTML = models.map(m =>
            `<option value="${m.id}">${m.name}</option>`
        ).join('');

        settingsElements.modelSelect.disabled = false;

        // Restore saved selection
        if (savedModel && models.find(m => m.id === savedModel)) {
            settingsElements.modelSelect.value = savedModel;
        }

        updateAiFeatureState();
    }

    // Update AI feature button states
    function updateAiFeatureState() {
        const hasApiKey = !!localStorage.getItem('poe_api_key');
        const hasModel = settingsElements.modelSelect && settingsElements.modelSelect.value;
        const enabled = serverAvailable && hasApiKey && hasModel;

        if (settingsElements.aiSummarize) settingsElements.aiSummarize.disabled = !enabled;
        if (settingsElements.aiInsights) settingsElements.aiInsights.disabled = !enabled;
        if (settingsElements.aiChat) settingsElements.aiChat.disabled = !enabled;
    }

    // Enable AI features (called after server check)
    function enableAiFeatures() {
        updateAiFeatureState();
    }

    // Run AI feature
    async function runAiFeature(featureType) {
        const apiKey = localStorage.getItem('poe_api_key');
        const model = settingsElements.modelSelect?.value || 'gpt-4o-mini';

        if (!apiKey) {
            alert('Please enter your Poe API key first');
            return;
        }

        if (!serverAvailable) {
            alert('AI features require the server. Run: node server.js');
            return;
        }

        // Prepare data summary
        const postCount = state.posts.length;
        const commentCount = state.comments.length;
        const subreddits = [...new Set(state.posts.map(p => p.subreddit))].slice(0, 20);
        const recentPosts = state.posts.slice(0, 10).map(p => `- ${p.title} (r/${p.subreddit})`).join('\n');

        let prompt;
        switch (featureType) {
            case 'summarize':
                prompt = `Summarize this Reddit user's posting activity:
- Total posts: ${postCount}
- Total comments: ${commentCount}
- Active subreddits: ${subreddits.join(', ')}

Recent posts:
${recentPosts}

Provide a brief, friendly summary of their Reddit activity.`;
                break;

            case 'insights':
                prompt = `Analyze this Reddit user's data and provide insights:
- Total posts: ${postCount}
- Total comments: ${commentCount}
- Active subreddits: ${subreddits.join(', ')}

Identify patterns, interests, and provide interesting observations about their Reddit usage.`;
                break;

            case 'chat':
                const question = window.prompt('What would you like to know about your Reddit data?');
                if (!question) return;
                prompt = `Based on this Reddit user's data:
- ${postCount} posts, ${commentCount} comments
- Subreddits: ${subreddits.join(', ')}

User question: ${question}

Answer helpfully based on the context of their Reddit activity.`;
                break;
        }

        // Show loading
        if (settingsElements.aiOutput) {
            settingsElements.aiOutput.classList.remove('hidden');
            settingsElements.aiOutput.classList.add('loading');
            settingsElements.aiOutput.textContent = 'Thinking...';
        }

        try {
            const response = await fetch('/api/poe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey, model, prompt })
            });

            const result = await response.json();

            if (settingsElements.aiOutput) {
                settingsElements.aiOutput.classList.remove('loading');
                if (result.success) {
                    settingsElements.aiOutput.textContent = result.content;
                } else {
                    settingsElements.aiOutput.textContent = 'Error: ' + (result.error || 'Unknown error');
                }
            }
        } catch (err) {
            if (settingsElements.aiOutput) {
                settingsElements.aiOutput.classList.remove('loading');
                settingsElements.aiOutput.textContent = 'Error: ' + err.message;
            }
        }
    }

    // Enhanced server status check
    async function checkServerStatus() {
        try {
            const response = await fetch('/api/status');
            if (response.ok) {
                serverAvailable = true;
                console.log('Server detected - all features enabled');

                // Update UI
                if (settingsElements.serverStatus) {
                    settingsElements.serverStatus.className = 'server-status online';
                    settingsElements.serverStatus.textContent = '● Online';
                }

                enableAiFeatures();
            }
        } catch (e) {
            serverAvailable = false;
            console.log('No server detected - limited features');

            if (settingsElements.serverStatus) {
                settingsElements.serverStatus.className = 'server-status offline';
                settingsElements.serverStatus.textContent = '● Offline';
            }
        }
    }

    // Start the app
    checkServerStatus();
    setupSettingsListeners();
    init();
})();
