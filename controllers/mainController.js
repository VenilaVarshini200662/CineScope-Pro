angular.module('cineScopePro')
    .controller('MainController', ['$http', '$scope', '$timeout', '$window', MainController]);

function MainController($http, $scope, $timeout, $window) {
    var vm = this;
    
    // API Configuration - REPLACE WITH YOUR ACTUAL API KEY
    const API_KEY = '5aef93f8'; // <-- PUT YOUR OMDb API KEY HERE
    const BASE_URL = 'https://www.omdbapi.com/';
    
    // UI State
    vm.activeTab = 'home';
    vm.scrolled = false;
    vm.isDarkMode = true; // Default to dark mode for modern look
    vm.isLoading = true;
    vm.searchLoading = false;
    vm.searchPerformed = false;
    vm.showModal = false;
    vm.toastMessage = '';
    vm.toastType = 'success';
    
    // Data
    vm.searchQuery = '';
    vm.movies = [];
    vm.filteredMovies = [];
    vm.trendingMovies = [];
    vm.selectedMovie = null;
    vm.totalResults = 0;
    vm.currentPage = 1;
    vm.totalPages = 0;
    vm.typeFilter = '';
    vm.yearFilter = '';
    vm.sortBy = '';
    vm.viewMode = 'grid';
    
    // Collections
    vm.favorites = [];
    vm.favoritesList = [];
    vm.watchlist = [];
    vm.watchlistList = [];
    vm.favoritesCount = 0;
    vm.watchlistCount = 0;
    
    // Trending Movies Data
    const trendingIds = [
        'tt1375666', 'tt0133093', 'tt0816692', 'tt0468569', 
        'tt0120737', 'tt0499549', 'tt0903747', 'tt1345836'
    ];
    
    // Initialize
    function init() {
        loadTheme();
        loadFavorites();
        loadWatchlist();
        loadTrendingMovies();
        setupScrollListener();
        
        // Simulate loading complete
        $timeout(function() {
            vm.isLoading = false;
            $scope.$apply();
        }, 1500);
    }
    
    // Load theme from localStorage
    function loadTheme() {
        var savedTheme = localStorage.getItem('cineScopeTheme');
        if (savedTheme !== null) {
            vm.isDarkMode = savedTheme === 'dark';
        } else {
            vm.isDarkMode = true; // Default to dark mode
        }
        applyTheme();
    }
    
    // Apply theme to body
    function applyTheme() {
        if (vm.isDarkMode) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
    
    // Toggle theme
    vm.toggleTheme = function() {
        vm.isDarkMode = !vm.isDarkMode;
        localStorage.setItem('cineScopeTheme', vm.isDarkMode ? 'dark' : 'light');
        applyTheme();
        showToast(vm.isDarkMode ? 'Dark mode activated' : 'Light mode activated', 'info');
    };
    
    // Load trending movies
    function loadTrendingMovies() {
        trendingIds.forEach(function(id, index) {
            $http.get(BASE_URL, { params: { apikey: API_KEY, i: id } })
                .then(function(response) {
                    if (response.data.Response === 'True') {
                        vm.trendingMovies.push(response.data);
                        if (vm.trendingMovies.length === trendingIds.length) {
                            vm.trendingMovies.sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating));
                        }
                    }
                });
        });
    }
    
    // Load favorites from localStorage
    function loadFavorites() {
        var saved = localStorage.getItem('cineScopeFavorites');
        vm.favorites = saved ? JSON.parse(saved) : [];
        vm.favoritesCount = vm.favorites.length;
        vm.favoritesList = vm.favorites;
    }
    
    // Load watchlist from localStorage
    function loadWatchlist() {
        var saved = localStorage.getItem('cineScopeWatchlist');
        vm.watchlist = saved ? JSON.parse(saved) : [];
        vm.watchlistCount = vm.watchlist.length;
        vm.watchlistList = vm.watchlist;
    }
    
    // Save favorites
    function saveFavorites() {
        localStorage.setItem('cineScopeFavorites', JSON.stringify(vm.favorites));
        vm.favoritesCount = vm.favorites.length;
        vm.favoritesList = vm.favorites;
    }
    
    // Save watchlist
    function saveWatchlist() {
        localStorage.setItem('cineScopeWatchlist', JSON.stringify(vm.watchlist));
        vm.watchlistCount = vm.watchlist.length;
        vm.watchlistList = vm.watchlist;
    }
    
    // Check if movie is favorite
    vm.isFavorite = function(imdbID) {
        return vm.favorites.some(function(f) { return f.imdbID === imdbID; });
    };
    
    // Check if movie is in watchlist
    vm.isInWatchlist = function(imdbID) {
        return vm.watchlist.some(function(w) { return w.imdbID === imdbID; });
    };
    
    // Toggle favorite
    vm.toggleFavorite = function(movie) {
        var index = vm.favorites.findIndex(function(f) { return f.imdbID === movie.imdbID; });
        if (index === -1) {
            vm.favorites.push({
                imdbID: movie.imdbID,
                Title: movie.Title,
                Year: movie.Year,
                Poster: movie.Poster,
                Type: movie.Type,
                imdbRating: movie.imdbRating
            });
            showToast('Added to favorites!', 'success');
        } else {
            vm.favorites.splice(index, 1);
            showToast('Removed from favorites', 'info');
        }
        saveFavorites();
    };
    
    // Toggle watchlist
    vm.toggleWatchlist = function(movie) {
        var index = vm.watchlist.findIndex(function(w) { return w.imdbID === movie.imdbID; });
        if (index === -1) {
            vm.watchlist.push({
                imdbID: movie.imdbID,
                Title: movie.Title,
                Year: movie.Year,
                Poster: movie.Poster,
                Type: movie.Type
            });
            showToast('Added to watchlist!', 'success');
        } else {
            vm.watchlist.splice(index, 1);
            showToast('Removed from watchlist', 'info');
        }
        saveWatchlist();
    };
    
    // Perform search
    vm.performSearch = function() {
        if (!vm.searchQuery || vm.searchQuery.trim() === '') {
            return;
        }
        
        vm.searchLoading = true;
        vm.searchPerformed = true;
        
        var params = {
            apikey: API_KEY,
            s: vm.searchQuery,
            page: vm.currentPage,
            type: vm.typeFilter || undefined,
            y: vm.yearFilter || undefined
        };
        
        $http.get(BASE_URL, { params: params })
            .then(function(response) {
                vm.searchLoading = false;
                if (response.data.Response === 'True') {
                    vm.movies = response.data.Search;
                    vm.totalResults = parseInt(response.data.totalResults);
                    vm.totalPages = Math.ceil(vm.totalResults / 10);
                    
                    // Fetch ratings for each movie
                    vm.movies.forEach(function(movie) {
                        $http.get(BASE_URL, { params: { apikey: API_KEY, i: movie.imdbID } })
                            .then(function(detailResponse) {
                                if (detailResponse.data.Response === 'True') {
                                    movie.imdbRating = detailResponse.data.imdbRating;
                                }
                            });
                    });
                    
                    vm.applySorting();
                } else {
                    vm.movies = [];
                    vm.totalResults = 0;
                    vm.totalPages = 0;
                }
            })
            .catch(function(error) {
                vm.searchLoading = false;
                showToast('Failed to connect to API. Check your API key!', 'error');
            });
    };
    
    // Apply sorting
    vm.applySorting = function() {
        var sorted = vm.movies.slice();
        switch(vm.sortBy) {
            case 'year_desc':
                sorted.sort(function(a, b) { return parseInt(b.Year) - parseInt(a.Year); });
                break;
            case 'year_asc':
                sorted.sort(function(a, b) { return parseInt(a.Year) - parseInt(b.Year); });
                break;
            case 'title_asc':
                sorted.sort(function(a, b) { return a.Title.localeCompare(b.Title); });
                break;
            case 'title_desc':
                sorted.sort(function(a, b) { return b.Title.localeCompare(a.Title); });
                break;
        }
        vm.filteredMovies = sorted;
    };
    
    // Clear filters
    vm.clearFilters = function() {
        vm.typeFilter = '';
        vm.yearFilter = '';
        vm.sortBy = '';
        vm.performSearch();
    };
    
    // Change page
    vm.changePage = function(page) {
        if (page >= 1 && page <= vm.totalPages) {
            vm.currentPage = page;
            vm.performSearch();
            $window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    // View movie details
    vm.viewMovieDetails = function(imdbID) {
        vm.isLoading = true;
        $http.get(BASE_URL, { params: { apikey: API_KEY, i: imdbID, plot: 'full' } })
            .then(function(response) {
                vm.isLoading = false;
                if (response.data.Response === 'True') {
                    vm.selectedMovie = response.data;
                    vm.showModal = true;
                }
            });
    };
    
    // Quick view
    vm.quickView = function(movie) {
        vm.selectedMovie = movie;
        vm.showModal = true;
    };
    
    // View full details from modal
    vm.viewFullDetails = function() {
        vm.viewMovieDetails(vm.selectedMovie.imdbID);
    };
    
    // Close modal
    vm.closeModal = function() {
        vm.showModal = false;
        vm.selectedMovie = null;
    };
    
    // Show toast notification
    function showToast(message, type) {
        vm.toastMessage = message;
        vm.toastType = type;
        $timeout(function() {
            vm.toastMessage = '';
        }, 3000);
    }
    
    // Set active tab
    vm.setActiveTab = function(tab) {
        vm.activeTab = tab;
        $window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // Setup scroll listener
    function setupScrollListener() {
        angular.element($window).bind('scroll', function() {
            vm.scrolled = $window.pageYOffset > 50;
            $scope.$apply();
        });
    }
    
    // Initialize
    init();
}
