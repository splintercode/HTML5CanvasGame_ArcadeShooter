System.register(['app/engine/engine', 'app/asteroid-collection', 'app/laser-collection', 'app/ship'], function(exports_1) {
    var engine_1, asteroid_collection_1, laser_collection_1, ship_1;
    return {
        setters:[
            function (_engine_1) {
                engine_1 = _engine_1;
            },
            function (_asteroid_collection_1) {
                asteroid_collection_1 = _asteroid_collection_1;
            },
            function (_laser_collection_1) {
                laser_collection_1 = _laser_collection_1;
            },
            function (_ship_1) {
                ship_1 = _ship_1;
            }],
        execute: function() {
            (function main() {
                'use strict';
                // Game Globals
                var GAME_STATE = { START: 'START', PLAY: 'PLAY', PAUSE: 'PAUSE', OVER: 'OVER' };
                var canvasContext = document.getElementById('GameCanvas').getContext('2d');
                var gameState = GAME_STATE.START;
                var gameScore = 0;
                var gameLives = 3;
                var viewPort = {
                    width: 720,
                    height: 480
                };
                //region Game
                var playerShip = new ship_1.Ship({ viewPort: viewPort, lasers: new laser_collection_1.LaserCollection() });
                var asteroids = new asteroid_collection_1.AsteroidCollection({ viewPort: viewPort });
                var controls = new engine_1.Controls();
                var game = new engine_1.Game({ init: init, update: update, draw: draw });
                game.start();
                function init() {
                    window.setInterval(function () {
                        if (gameState === GAME_STATE.PLAY) {
                            asteroids.addAsteroid();
                        }
                    }, 140 - (viewPort.width / 100));
                }
                function update() {
                    if (gameState === GAME_STATE.PLAY) {
                        asteroids.update();
                        playerShip.update();
                        checkShipAndAsteroidCollision();
                        checkShipLaserAndAsteroidCollision();
                    }
                    else {
                        return;
                    }
                }
                function draw() {
                    canvasContext.clearRect(0, 0, viewPort.width, viewPort.height);
                    drawScore();
                    drawLives();
                    if (gameState === GAME_STATE.START) {
                        drawStartScreen();
                    }
                    else if (gameState === GAME_STATE.PLAY) {
                        playerShip.draw(canvasContext);
                        asteroids.draw(canvasContext);
                    }
                    else if (gameState === GAME_STATE.PAUSE) {
                        console.log('Paused');
                    }
                    else if (gameState === GAME_STATE.OVER) {
                        endGame();
                    }
                    else {
                        drawStartScreen();
                    }
                }
                function checkShipAndAsteroidCollision() {
                    asteroids.list.forEach(function (asteroid, index) {
                        if (engine_1.CollisionDetection.check(playerShip, asteroid)) {
                            asteroids.list.splice(index, 1);
                            removeLife();
                        }
                    });
                }
                ;
                function checkShipLaserAndAsteroidCollision() {
                    playerShip.lasers.list.forEach(function (laser, laserIndex) {
                        asteroids.list.forEach(function (asteroid, asteroidIndex) {
                            if (engine_1.CollisionDetection.check(laser, asteroid)) {
                                playerShip.lasers.list.splice(laserIndex, 1);
                                asteroids.list.splice(asteroidIndex, 1);
                                addScore();
                            }
                        });
                    });
                }
                ;
                //endregion
                //region Key Game Controls
                controls.on('left', function () {
                    if (gameState === GAME_STATE.PLAY) {
                        playerShip.moveLeft();
                    }
                });
                controls.on('right', function () {
                    if (gameState === GAME_STATE.PLAY) {
                        playerShip.moveRight();
                    }
                });
                controls.on('up', function () {
                    if (gameState === GAME_STATE.PLAY) {
                        playerShip.moveUp();
                    }
                });
                controls.on('down', function () {
                    if (gameState === GAME_STATE.PLAY) {
                        playerShip.moveDown();
                    }
                });
                controls.onKey('space', function () {
                    if (gameState === GAME_STATE.PLAY) {
                        playerShip.fire();
                    }
                });
                controls.onKey('pause', function () {
                    pauseGame();
                });
                controls.onKey('enter', function () {
                    if (gameState === GAME_STATE.START || gameState === GAME_STATE.OVER) {
                        startNewGame();
                    }
                });
                //endregion
                //region Helper Functions
                function drawStartScreen() {
                    $('.js-start-screen').show();
                }
                function hideStartScreen() {
                    $('.js-start-screen').hide();
                }
                function startNewGame() {
                    gameLives = 3;
                    gameState = GAME_STATE.PLAY;
                    gameScore = 0;
                    hideStartScreen();
                    $('.js-game-over-screen').hide();
                }
                function pauseGame() {
                    drawPauseScreen();
                    if (gameState === GAME_STATE.PLAY) {
                        gameState = GAME_STATE.PAUSE;
                    }
                    else {
                        gameState = GAME_STATE.PLAY;
                    }
                }
                function drawPauseScreen() {
                    $('.js-pause-screen').toggle();
                }
                function endGame() {
                    $('.js-game-over-screen').show();
                }
                function addScore() {
                    gameScore += 1;
                }
                function drawScore() {
                    $('.js-score').html('Score:' + gameScore);
                }
                function removeLife() {
                    if (gameLives > 0) {
                        gameLives -= 1;
                    }
                    else {
                        gameState = GAME_STATE.OVER;
                    }
                }
                function drawLives() {
                    $('.js-lives').html('Lives:' + gameLives);
                }
                //endregion
            }());
        }
    }
});
