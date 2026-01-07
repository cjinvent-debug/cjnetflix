const API_KEY = 'c11e35890d148a8af9d3392db9ab8b0b';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const IMAGE_BASE_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// URL에서 영화 ID 가져오기
function getMovieIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// 영화 상세 정보 가져오기
async function fetchMovieDetail(movieId) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=ko-KR`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const movie = await response.json();
        displayMovieDetail(movie);
    } catch (error) {
        console.error('영화 상세 정보를 가져오는 중 오류 발생:', error);
        showError(error.message);
    }
}

// 영화 상세 정보 표시
function displayMovieDetail(movie) {
    const loadingContainer = document.getElementById('loading');
    const movieDetailContainer = document.getElementById('movieDetail');
    const errorContainer = document.getElementById('errorMessage');
    
    loadingContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    movieDetailContainer.style.display = 'block';
    
    // 포스터 이미지
    const posterImg = document.getElementById('detailPoster');
    if (movie.poster_path) {
        posterImg.src = `${IMAGE_BASE_URL_ORIGINAL}${movie.poster_path}`;
        posterImg.alt = movie.title;
    } else {
        posterImg.src = '';
        posterImg.style.display = 'none';
    }
    
    // 제목
    document.getElementById('detailTitle').textContent = movie.title;
    
    // 개봉일
    const releaseDateEl = document.getElementById('detailReleaseDate');
    if (movie.release_date) {
        const date = new Date(movie.release_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        releaseDateEl.textContent = `🎬 ${year}.${month}.${day}`;
    } else {
        releaseDateEl.textContent = '🎬 날짜 미상';
    }
    
    // 상영 시간
    const runtimeEl = document.getElementById('detailRuntime');
    if (movie.runtime) {
        const hours = Math.floor(movie.runtime / 60);
        const minutes = movie.runtime % 60;
        runtimeEl.textContent = `⏱️ ${hours}시간 ${minutes}분`;
    } else {
        runtimeEl.textContent = '⏱️ 시간 미상';
    }
    
    // 평점
    const ratingEl = document.getElementById('detailRating');
    if (movie.vote_average) {
        ratingEl.textContent = `⭐ ${movie.vote_average.toFixed(1)}/10`;
    } else {
        ratingEl.textContent = '⭐ 평점 없음';
    }
    
    // 장르
    const genresEl = document.getElementById('detailGenres');
    if (movie.genres && movie.genres.length > 0) {
        genresEl.innerHTML = movie.genres
            .map(genre => `<span class="genre-tag">${genre.name}</span>`)
            .join('');
    } else {
        genresEl.innerHTML = '<span class="genre-tag">장르 정보 없음</span>';
    }
    
    // 줄거리
    const overviewEl = document.getElementById('detailOverview');
    if (movie.overview) {
        overviewEl.textContent = movie.overview;
    } else {
        overviewEl.textContent = '줄거리 정보가 없습니다.';
    }
    
    // 통계 정보
    document.getElementById('detailPopularity').textContent = 
        movie.popularity ? movie.popularity.toFixed(1) : '0.0';
    document.getElementById('detailVoteAverage').textContent = 
        movie.vote_average ? movie.vote_average.toFixed(1) : '0.0';
    document.getElementById('detailVoteCount').textContent = 
        movie.vote_count ? movie.vote_count.toLocaleString() : '0';
    
    // 페이지 제목 업데이트
    document.title = `${movie.title} - CJNETFLIX`;
}

// 에러 메시지 표시
function showError(errorMessage) {
    const loadingContainer = document.getElementById('loading');
    const movieDetailContainer = document.getElementById('movieDetail');
    const errorContainer = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    loadingContainer.style.display = 'none';
    movieDetailContainer.style.display = 'none';
    errorContainer.style.display = 'block';
    errorText.textContent = errorMessage;
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    const movieId = getMovieIdFromURL();
    
    if (!movieId) {
        showError('영화 ID가 제공되지 않았습니다.');
        return;
    }
    
    fetchMovieDetail(movieId);
});
