const API_KEY = 'c11e35890d148a8af9d3392db9ab8b0b';
const API_URL = 'https://api.themoviedb.org/3/movie/now_playing';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const top10Container = document.getElementById('top10Container');
const allMoviesContainer = document.getElementById('allMoviesContainer');

// Netflix 인트로 오디오 파일 로드
let netflixAudio = null;

// 오디오 파일 로드 시도
function loadNetflixAudio() {
    // netflixaudio.m4a 파일을 우선적으로 시도
    const audioFormats = ['netflixaudio.m4a', 'netflix-intro.mp3', 'netflix-intro.wav', 'netflix-intro.ogg'];
    
    let formatIndex = 0;
    
    function tryNextFormat() {
        if (formatIndex >= audioFormats.length) {
            console.log('오디오 파일을 찾을 수 없습니다. 생성된 소리를 사용합니다.');
            return;
        }
        
        const audio = new Audio(audioFormats[formatIndex]);
        audio.preload = 'auto';
        
        audio.addEventListener('canplaythrough', () => {
            netflixAudio = audio;
            console.log('Netflix 오디오 파일 로드 성공:', audioFormats[formatIndex]);
        });
        
        audio.addEventListener('error', () => {
            // 다음 형식 시도
            formatIndex++;
            tryNextFormat();
        });
        
        audio.load();
    }
    
    tryNextFormat();
}

// Netflix 사운드 재생 함수
function playNetflixSound() {
    // 오디오 파일이 있으면 사용
    if (netflixAudio) {
        try {
            netflixAudio.currentTime = 0; // 처음부터 재생
            netflixAudio.play().catch(error => {
                console.log('오디오 재생 실패:', error);
                // 오디오 파일 재생 실패 시 생성된 소리 사용
                playGeneratedSound();
            });
        } catch (error) {
            console.log('오디오 재생 실패:', error);
            playGeneratedSound();
        }
    } else {
        // 오디오 파일이 없으면 생성된 소리 사용
        playGeneratedSound();
    }
}

// 생성된 소리 재생 (fallback)
function playGeneratedSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
    } catch (error) {
        console.log('오디오 재생 실패:', error);
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
        <div class="movie-card">
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
            playNetflixSound();
        });
    });
}

// 페이지 로드 시 영화 데이터 가져오기 및 오디오 로드
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies();
    loadNetflixAudio();
});
