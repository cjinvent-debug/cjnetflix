const API_KEY = 'c11e35890d148a8af9d3392db9ab8b0b';
const API_URL = 'https://api.themoviedb.org/3/movie/now_playing';
const UPCOMING_API_URL = 'https://api.themoviedb.org/3/movie/upcoming';
const SEARCH_API_URL = 'https://api.themoviedb.org/3/search/movie';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const top10Container = document.getElementById('top10Container');
const allMoviesContainer = document.getElementById('allMoviesContainer');
const upcomingContainer = document.getElementById('upcomingContainer');
const searchResultsContainer = document.getElementById('searchResultsContainer');
const searchResultsSection = document.getElementById('searchResultsSection');
const searchInput = document.getElementById('searchInput');
const mainContent = document.getElementById('mainContent');
const allMoviesSection = document.getElementById('allMoviesSection');
const upcomingSection = document.getElementById('upcomingSection');

let searchTimeout = null;

// Netflix 인트로 오디오 파일 로드
let netflixAudio = null;
let isPlaying = false; // 오디오 재생 중인지 추적
let isLoading = false; // 오디오 로드 중인지 추적

// 오디오 파일 로드 시도
function loadNetflixAudio() {
    // 이미 로드되었거나 로드 중이면 중복 로드 방지
    if (netflixAudio || isLoading) {
        return;
    }
    
    isLoading = true;
    // netflixaudio.m4a 파일만 사용
    const audio = new Audio('netflixaudio.m4a');
    audio.preload = 'auto';
    
    audio.addEventListener('canplaythrough', () => {
        netflixAudio = audio;
        isLoading = false;
        console.log('Netflix 오디오 파일 로드 성공: netflixaudio.m4a');
    });
    
    audio.addEventListener('error', () => {
        isLoading = false;
        console.log('오디오 파일을 찾을 수 없습니다: netflixaudio.m4a');
    });
    
    audio.load();
}

// Netflix 사운드 재생 함수
function playNetflixSound() {
    // 이미 재생 중이면 중복 재생 방지
    if (isPlaying) {
        return;
    }
    
    // netflixaudio.m4a 파일만 재생 (다른 소리는 재생하지 않음)
    if (netflixAudio) {
        try {
            isPlaying = true;
            netflixAudio.currentTime = 0; // 처음부터 재생
            netflixAudio.play().then(() => {
                // 재생 완료 시 isPlaying 리셋
                netflixAudio.addEventListener('ended', () => {
                    isPlaying = false;
                }, { once: true });
            }).catch(error => {
                console.log('오디오 재생 실패:', error);
                isPlaying = false;
                // netflixaudio.m4a만 사용하므로 실패 시 아무 소리도 재생하지 않음
            });
        } catch (error) {
            console.log('오디오 재생 실패:', error);
            isPlaying = false;
            // netflixaudio.m4a만 사용하므로 실패 시 아무 소리도 재생하지 않음
        }
    } else {
        // 오디오 파일이 아직 로드되지 않았으면 로드 시도
        loadNetflixAudio();
        // 로드 완료를 기다렸다가 재생 시도
        const checkAudio = setInterval(() => {
            if (netflixAudio) {
                clearInterval(checkAudio);
                playNetflixSound();
            }
        }, 100);
        // 3초 후에도 로드되지 않으면 포기
        setTimeout(() => {
            clearInterval(checkAudio);
        }, 3000);
    }
}

// AudioContext 재사용을 위한 전역 변수
let audioContext = null;

// 생성된 소리 재생 (fallback)
function playGeneratedSound() {
    try {
        // AudioContext 재사용 (없으면 생성)
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // AudioContext가 suspended 상태면 resume
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const duration = 0.5;
        const sampleRate = audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            if (t < 0.08) {
                const taTime = t / 0.08;
                const freq = 180 + taTime * 100;
                const amp = 0.6 * Math.exp(-taTime * 8);
                sample += Math.sin(2 * Math.PI * freq * t) * amp;
                sample += Math.sin(2 * Math.PI * freq * 2 * t) * amp * 0.4;
                sample += Math.sin(2 * Math.PI * freq * 3 * t) * amp * 0.2;
            } else {
                const dumTime = (t - 0.08) / 0.42;
                const freq = 350 - dumTime * 210;
                const amp = 0.7 * Math.exp(-dumTime * 3.5);
                sample += Math.sin(2 * Math.PI * freq * t) * amp;
                sample += Math.sin(2 * Math.PI * freq * 2 * t) * amp * 0.5;
                sample += Math.sin(2 * Math.PI * freq * 3 * t) * amp * 0.25;
                sample += Math.sin(2 * Math.PI * freq * 4 * t) * amp * 0.15;
            }
            
            const globalEnvelope = Math.exp(-t * 1.8);
            data[i] = sample * globalEnvelope;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
        
        // 재생 완료 시 isPlaying 리셋
        source.addEventListener('ended', () => {
            isPlaying = false;
        }, { once: true });
    } catch (error) {
        console.log('오디오 재생 실패:', error);
        isPlaying = false;
    }
}

// 영화 데이터 가져오기
async function fetchMovies() {
    try {
        const response = await fetch(`${API_URL}?api_key=${API_KEY}&language=ko-KR&page=1`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayMovies(data.results);
    } catch (error) {
        console.error('영화 데이터를 가져오는 중 오류 발생:', error);
        const errorMessage = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #e50914;">
                <p>영화를 불러오는 중 오류가 발생했습니다.</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #808080;">${error.message}</p>
            </div>
        `;
        top10Container.innerHTML = errorMessage;
        allMoviesContainer.innerHTML = errorMessage;
    }
}

// 영화 카드 생성 함수
function createMovieCard(movie, showRank = false, rank = null) {
    const posterPath = movie.poster_path 
        ? `${IMAGE_BASE_URL}${movie.poster_path}`
        : null;
    
    // 개봉일 포맷팅 (YYYY-MM-DD -> YYYY.MM.DD)
    let releaseDateFormatted = '날짜 미상';
    if (movie.release_date) {
        const date = new Date(movie.release_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        releaseDateFormatted = `${year}.${month}.${day}`;
    }

    // 인기도 포맷팅 (소수점 1자리)
    const popularity = movie.popularity 
        ? movie.popularity.toFixed(1)
        : '0.0';

    return `
        <div class="movie-card" data-movie-id="${movie.id}">
            ${showRank && rank ? `<div class="movie-rank-badge">${rank}</div>` : ''}
            ${posterPath 
                ? `<img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy">`
                : `<div class="movie-poster-placeholder">포스터 없음</div>`
            }
            <div class="movie-info">
                <h3 class="movie-title" title="${movie.title}">${movie.title}</h3>
                <div class="movie-details">
                    <span class="movie-release-date">🎬 ${releaseDateFormatted}</span>
                    <span class="movie-popularity">⭐ ${popularity}</span>
                </div>
            </div>
        </div>
    `;
}

// 영화 카드 표시
function displayMovies(movies) {
    if (!movies || movies.length === 0) {
        const emptyMessage = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #808080;">
                현재 상영 중인 영화가 없습니다.
            </div>
        `;
        top10Container.innerHTML = emptyMessage;
        allMoviesContainer.innerHTML = emptyMessage;
        return;
    }

    // 인기도 기준으로 내림차순 정렬 후 상위 10개만 선택
    const top10Movies = [...movies]
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 10);

    // TOP10 영화의 ID를 Set으로 저장
    const top10Ids = new Set(top10Movies.map(movie => movie.id));

    // 나머지 영화들 (TOP10 제외)을 개봉일 순으로 정렬
    const remainingMovies = movies
        .filter(movie => !top10Ids.has(movie.id))
        .sort((a, b) => {
            const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
            const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
            return dateB - dateA; // 최신순 (내림차순)
        });

    // TOP10 섹션 표시
    top10Container.innerHTML = top10Movies.map((movie, index) => 
        createMovieCard(movie, true, index + 1)
    ).join('');

    // 나머지 영화 섹션 표시
    if (remainingMovies.length > 0) {
        allMoviesContainer.innerHTML = remainingMovies.map(movie => 
            createMovieCard(movie, false)
        ).join('');
    } else {
        allMoviesContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #808080;">
                추가 영화가 없습니다.
            </div>
        `;
    }

    // 모든 영화 카드에 클릭 이벤트 추가
    attachClickEvents();
}

// 영화 카드 클릭 이벤트 추가
function attachClickEvents() {
    const allCards = document.querySelectorAll('.movie-card');
    allCards.forEach(card => {
        card.addEventListener('click', () => {
            const movieId = card.getAttribute('data-movie-id');
            if (movieId) {
                // 상세 페이지로 이동 (오디오는 상세 페이지에서 재생)
                window.location.href = `movie-detail.html?id=${movieId}`;
            }
        });
    });
}

// 개봉예정 영화 데이터 가져오기
async function fetchUpcomingMovies() {
    try {
        const response = await fetch(`${UPCOMING_API_URL}?api_key=${API_KEY}&language=ko-KR&page=1`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayUpcomingMovies(data.results);
    } catch (error) {
        console.error('개봉예정 영화 데이터를 가져오는 중 오류 발생:', error);
        const errorMessage = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #e50914;">
                <p>개봉예정 영화를 불러오는 중 오류가 발생했습니다.</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #808080;">${error.message}</p>
            </div>
        `;
        upcomingContainer.innerHTML = errorMessage;
    }
}

// 개봉예정 영화 표시
function displayUpcomingMovies(movies) {
    if (!movies || movies.length === 0) {
        const emptyMessage = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #808080;">
                개봉예정 영화가 없습니다.
            </div>
        `;
        upcomingContainer.innerHTML = emptyMessage;
        return;
    }

    // 개봉일 순으로 정렬 (오름차순 - 가장 가까운 날짜부터)
    const sortedMovies = [...movies].sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
        const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
        return dateA - dateB; // 오름차순 (가까운 날짜부터)
    });

    // 개봉예정 영화 섹션 표시
    upcomingContainer.innerHTML = sortedMovies.map(movie => 
        createMovieCard(movie, false)
    ).join('');

    // 개봉예정 영화 카드에 클릭 이벤트 추가
    attachClickEvents();
}

// 영화 검색 함수
async function searchMovies(query) {
    if (!query || query.trim() === '') {
        // 검색어가 비어있으면 메인 콘텐츠 표시
        searchResultsSection.style.display = 'none';
        mainContent.style.display = 'block';
        allMoviesSection.style.display = 'block';
        upcomingSection.style.display = 'block';
        return;
    }

    try {
        searchResultsContainer.innerHTML = '<div class="loading">검색 중...</div>';
        searchResultsSection.style.display = 'block';
        mainContent.style.display = 'none';
        allMoviesSection.style.display = 'none';
        upcomingSection.style.display = 'none';

        const response = await fetch(
            `${SEARCH_API_URL}?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}&page=1`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displaySearchResults(data.results, query);
    } catch (error) {
        console.error('영화 검색 중 오류 발생:', error);
        const errorMessage = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #e50914;">
                <p>검색 중 오류가 발생했습니다.</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #808080;">${error.message}</p>
            </div>
        `;
        searchResultsContainer.innerHTML = errorMessage;
    }
}

// 검색 결과 표시
function displaySearchResults(movies, query) {
    if (!movies || movies.length === 0) {
        const emptyMessage = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #808080;">
                <p>"${query}"에 대한 검색 결과가 없습니다.</p>
            </div>
        `;
        searchResultsContainer.innerHTML = emptyMessage;
        return;
    }

    // 검색 결과 섹션 제목 업데이트
    const sectionTitle = searchResultsSection.querySelector('.section-title');
    sectionTitle.textContent = `"${query}" 검색 결과 (${movies.length}개)`;

    // 검색 결과 표시
    searchResultsContainer.innerHTML = movies.map(movie => 
        createMovieCard(movie, false)
    ).join('');

    // 검색 결과 카드에 클릭 이벤트 추가
    attachClickEvents();
}

// 검색 입력 이벤트 리스너
function setupSearchListener() {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // 디바운싱: 입력이 멈춘 후 500ms 후에 검색 실행
        clearTimeout(searchTimeout);
        
        if (query === '') {
            // 검색어가 비어있으면 즉시 메인 콘텐츠 표시
            searchResultsSection.style.display = 'none';
            mainContent.style.display = 'block';
            allMoviesSection.style.display = 'block';
            upcomingSection.style.display = 'block';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            searchMovies(query);
        }, 500);
    });

    // Enter 키로 즉시 검색
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            if (query) {
                searchMovies(query);
            }
        }
    });
}

// 페이지 로드 시 영화 데이터 가져오기 및 오디오 로드
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies();
    fetchUpcomingMovies();
    loadNetflixAudio();
    setupSearchListener();
});
