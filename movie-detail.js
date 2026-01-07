const API_KEY = 'c11e35890d148a8af9d3392db9ab8b0b';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const IMAGE_BASE_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

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
    
    // 상세 페이지가 표시될 때 오디오 재생
    playNetflixSound();
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
    // 오디오 파일 로드
    loadNetflixAudio();
    
    const movieId = getMovieIdFromURL();
    
    if (!movieId) {
        showError('영화 ID가 제공되지 않았습니다.');
        return;
    }
    
    fetchMovieDetail(movieId);
});
