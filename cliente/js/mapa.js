export default class mapa extends Phaser.Scene {
  constructor () {
    super('mapa')
  }

  preload () {
    // Carrega os sons
    // this.load.audio('iniciar', './assets/iniciar.mp3')

    // Carregar o mapa
    this.load.tilemapTiledJSON('mapa', './assets/mapa/dugeonfinal.json')

    // Carregar as imagens do mapa
    this.load.image('tileset_sf', './assets/mapa/tileset_sf.png')
    this.load.image('blocopreto', './assets/mapa/blocopreto.png')

    // Carregar spritesheets
    this.load.spritesheet('alex', './assets/personagens/alex.png', { frameWidth: 36, frameHeight: 64 })
    this.load.spritesheet('stella', './assets/personagens/stella.png', { frameWidth: 36, frameHeight: 64 })
    this.load.spritesheet('alien', './assets/personagens/alien.png', { frameWidth: 37, frameHeight: 48 })
    this.load.spritesheet('cartao', './assets/animacoes/cartao.png', { frameWidth: 32, frameHeight: 32 })

    // Carrega as imagens dos botões
    this.load.spritesheet('cima', './assets/botoes/cima.png', { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('baixo', './assets/botoes/baixo.png', { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('esquerda', './assets/botoes/esquerda.png', { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('direita', './assets/botoes/direita.png', { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('tela-cheia', './assets/botoes/tela-cheia.png', { frameWidth: 56, frameHeight: 56 })
  }

  create () {
    // Adiciona ponteiro
    this.input.addPointer(3)

    // Adiciona o som de fundo
    this.sound.add('iniciar', { loop: true }).play()

    // Cria objeto do mapa
    this.tilemapMapa = this.make.tilemap({ key: 'mapa' })

    // Cria os tilesets do mapa
    this.tilesetGeral = this.tilemapMapa.addTilesetImage('tileset_sf')

    // Camadas do mapa e personagem
    this.layerfundo = this.tilemapMapa.createLayer('fundo', [this.tilesetGeral])
    this.layerchao = this.tilemapMapa.createLayer('chao', [this.tilesetGeral])
    this.layerparedes = this.tilemapMapa.createLayer('paredes', [this.tilesetGeral])
    this.layerobjetos = this.tilemapMapa.createLayer('objetos', [this.tilesetGeral])

    if (globalThis.game.jogadores.primeiro === globalThis.game.socket.id) {
      globalThis.game.remoteConnection = new RTCPeerConnection(globalThis.game.iceServers)
      globalThis.game.dadosJogo = globalThis.game.remoteConnection.createDataChannel('dadosJogo', { negotiated: true, id: 0 })

      globalThis.game.remoteConnection.onicecandidate = function ({ candidate }) {
        candidate && globalThis.game.socket.emit('candidate', globalThis.game.sala, candidate)
      }

      globalThis.game.remoteConnection.ontrack = function ({ streams: [midia] }) {
        globalThis.game.audio.srcObject = midia
      }

      if (globalThis.game.midias) {
        globalThis.game.midias.getTracks()
          .forEach((track) => globalThis.game.remoteConnection.addTrack(track, globalThis.game.midias))
      }

      globalThis.game.socket.on('offer', (description) => {
        globalThis.game.remoteConnection.setRemoteDescription(description)
          .then(() => globalThis.game.remoteConnection.createAnswer())
          .then((answer) => globalThis.game.remoteConnection.setLocalDescription(answer))
          .then(() => globalThis.game.socket.emit('answer', globalThis.game.sala, globalThis.game.remoteConnection.localDescription))
      })

      globalThis.game.socket.on('candidate', (candidate) => {
        globalThis.game.remoteConnection.addIceCandidate(candidate)
      })

      // Cria os sprites dos personagens local e remoto
      this.personagemLocal = this.physics.add.sprite(5284, 3872, 'alex')
      this.personagemRemoto = this.physics.add.sprite(5224, 3872, 'stella')
    } else if (globalThis.game.jogadores.segundo === globalThis.game.socket.id) {
      globalThis.game.localConnection = new RTCPeerConnection(globalThis.game.iceServers)
      globalThis.game.dadosJogo = globalThis.game.localConnection.createDataChannel('dadosJogo', { negotiated: true, id: 0 })

      globalThis.game.localConnection.onicecandidate = function ({ candidate }) {
        candidate && globalThis.game.socket.emit('candidate', globalThis.game.sala, candidate)
      }

      globalThis.game.localConnection.ontrack = function ({ streams: [stream] }) {
        globalThis.game.audio.srcObject = stream
      }

      if (globalThis.game.midias) {
        globalThis.game.midias.getTracks()
          .forEach((track) => globalThis.game.localConnection.addTrack(track, globalThis.game.midias))
      }

      globalThis.game.localConnection.createOffer()
        .then((offer) => globalThis.game.localConnection.setLocalDescription(offer))
        .then(() => globalThis.game.socket.emit('offer', globalThis.game.sala, globalThis.game.localConnection.localDescription))

      globalThis.game.socket.on('answer', (description) => {
        globalThis.game.localConnection.setRemoteDescription(description)
      })

      globalThis.game.socket.on('candidate', (candidate) => {
        globalThis.game.localConnection.addIceCandidate(candidate)
      })

      // Cria os sprites dos personagens local e remoto
      this.personagemLocal = this.physics.add.sprite(5224, 3872, 'stella')
      this.personagemRemoto = this.physics.add.sprite(5284, 3872, 'alex')
    }

    // Define o atributo do tileset para gerar colisao
    this.layerparedes.setCollisionByProperty({ collides: true })
    this.physics.add.collider(this.personagemLocal, this.layerparedes)
    this.layerobjetos.setCollisionByProperty({ collides: true })
    this.physics.add.collider(this.personagemLocal, this.layerobjetos)

    // Câmera segue o personagem local
    this.cameras.main.startFollow(this.personagemLocal)

    this.cima = this.add.sprite(100, 250, 'cima', 0)
      .setScrollFactor(0) // nao se move com a câmera
      .setInteractive() // permite interaçao com o sprite
      .on('pointerdown', () => {
        // Altera o frame do botao para pressionado
        this.cima.setFrame(1)

        // Faz o personagem andar para cima
        this.personagemLocal.setVelocityY(-250)

        // Anima o personagem andando para cima
        this.personagemLocal.anims.play('personagem-cima')
      })
      .on('pointerup', () => {
        // Altera o frame do botao para o estado original
        this.cima.setFrame(0)

        // Faz o personagem parar
        this.personagemLocal.setVelocityY(0)

        // Anima o personagem parado
        this.personagemLocal.anims.play('personagem-parado')
      })

    // Animação Personagem
    this.anims.create({
      key: 'personagem-esquerda',
      frames: this.anims.generateFrameNumbers(this.personagemLocal.texture.key, {
        start: 11,
        end: 18
      }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'personagem-direita',
      frames: this.anims.generateFrameNumbers(this.personagemLocal.texture.key, {
        start: 3,
        end: 10
      }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'personagem-cima',
      frames: this.anims.generateFrameNumbers(this.personagemLocal.texture.key, {
        start: 20,
        end: 21
      }),
      frameRate: 5,
      repeat: -1
    })

    this.anims.create({
      key: 'personagem-baixo',
      frames: this.anims.generateFrameNumbers(this.personagemLocal.texture.key, {
        start: 1,
        end: 2
      }),
      frameRate: 5,
      repeat: -1
    })

    this.anims.create({
      key: 'personagem-parado',
      frames: this.anims.generateFrameNumbers(this.personagemLocal.texture.key, {
        start: 0,
        end: 0
      }),
      frameRate: 1
    })

    // Animação alien
    this.anims.create({
      key: 'alien-parado',
      frames: this.anims.generateFrameNumbers('alien', {
        start: 7,
        end: 7
      }),
      frameRate: 1
    })

    this.anims.create({
      key: 'alien-esquerda',
      frames: this.anims.generateFrameNumbers('alien', {
        start: 3,
        end: 5
      }),
      frameRate: 5,
      repeat: -1
    })

    this.anims.create({
      key: 'alien-direita',
      frames: this.anims.generateFrameNumbers('alien', {
        start: 9,
        end: 11
      }),
      frameRate: 5,
      repeat: -1
    })
    this.anims.create({
      key: 'alien-cima',
      frames: this.anims.generateFrameNumbers('alien', {
        start: 0,
        end: 2
      }),
      frameRate: 5,
      repeat: -1
    })
    this.anims.create({
      key: 'alien-baixo',
      frames: this.anims.generateFrameNumbers('alien', {
        start: 6,
        end: 8
      }),
      frameRate: 5,
      repeat: -1
    })

    this.baixo = this.add.sprite(100, 350, 'baixo', 0)
      .setScrollFactor(0) // nao se move com a câmera
      .setInteractive() // permite interaçao com o sprite
      .on('pointerdown', () => {
        // Altera o frame do botao para pressionado
        this.baixo.setFrame(1)

        // Faz o personagem andar para baixo
        this.personagemLocal.setVelocityY(250)
        // Anima o personagem andando para baixo
        this.personagemLocal.anims.play('personagem-baixo')
      })
      .on('pointerup', () => {
        // Altera o frame do botao para o estado original
        this.baixo.setFrame(0)

        // Para o personagem velocidade
        this.personagemLocal.setVelocityY(0)

        // Anima o personagem parado
        this.personagemLocal.anims.play('personagem-parado')
      })

    this.esquerda = this.add.sprite(600, 350, 'esquerda', 0)
      .setScrollFactor(0) // nao se move com a câmera
      .setInteractive() // permite interaçao com o sprite
      .on('pointerdown', () => {
        // Altera o frame do botao para pressionado
        this.esquerda.setFrame(1)

        // Faz o personagem andar para a esquerda
        this.personagemLocal.setVelocityX(-250)

        // Muda a variável de controle do lado do personagem
        this.personagemLocal.anims.play('personagem-esquerda')
      })
      .on('pointerup', () => {
        // Altera o frame do botao para o estado original
        this.esquerda.setFrame(0)

        // Para o personagem
        this.personagemLocal.setVelocityX(0)

        // Anima o personagem parado
        this.personagemLocal.anims.play('personagem-parado')
      })

    this.direita = this.add.sprite(700, 350, 'direita', 0)
      .setScrollFactor(0) // nao se move com a câmera
      .setInteractive() // permite interaçao com o sprite
      .on('pointerdown', () => {
        // Altera o frame do botao para pressionado
        this.direita.setFrame(1)

        // Faz o personagem andar para a direita
        this.personagemLocal.setVelocityX(250)

        // Muda a variável de controle do lado do personagem
        this.personagemLocal.anims.play('personagem-direita')
      })
      .on('pointerup', () => {
        // Altera o frame do botao para o estado original
        this.direita.setFrame(0)

        // Para o personagem
        this.personagemLocal.setVelocityX(0)

        // Anima o personagem parado
        this.personagemLocal.anims.play('personagem-parado')
      })

    // posições dos cartões
    this.cartao = [
      {
        x: 3267,
        y: 5508
      },
      {
        x: 4756,
        y: 5194
      },
      {
        x: 4998,
        y: 7584
      },
      {
        x: 3474,
        y: 8224
      },
      {
        x: 2660,
        y: 7776
      },
      {
        x: 6624,
        y: 6873
      },
      {
        x: 5830,
        y: 5216
      },
      {
        x: 5830,
        y: 5216
      },
      {
        x: 5830,
        y: 5216
      },
      {
        x: 5830,
        y: 5216
      }
    ]

    // Animaçao cartao
    this.anims.create({
      key: 'cartao-girando',
      frames: this.anims.generateFrameNumbers('cartao', {
        start: 0,
        end: 7
      }),
      frameRate: 5,
      repeat: -1
    })

    this.cartao.forEach((cartao) => {
      cartao.objeto = this.physics.add.sprite(cartao.x, cartao.y, 'cartao')
      cartao.objeto.anims.play('cartao-girando')
      cartao.colisao = this.physics.add.overlap(this.personagemLocal, cartao.objeto, () => {
        cartao.objeto.disableBody(true, true)
        cartao.coletor = true
      }, null, this)
    })

    globalThis.game.dadosJogo.onmessage = (event) => {
      const dados = JSON.parse(event.data)

      // Verifica se os dados recebidos contêm informações sobre o personagem
      if (dados.personagem) {
        this.personagemRemoto.x = dados.personagem.x
        this.personagemRemoto.y = dados.personagem.y
        this.personagemRemoto.setFrame(dados.personagem.frame)
      }

      // Verifica se os dados recebidos contêm informações sobre os cartões
      if (dados.cartao) {
        // Atualiza a visibilidade dos cartões
        this.cartao.forEach((cartao, i) => {
          // Atualiza a visibilidade do cartão
          if (!dados.cartao[i].visible) {
            cartao.objeto.disableBody(true, true)
          }
        })
      }

      if (dados.gameover) {
        this.scene.stop('mapa')
        this.scene.start('finalTriste')
      }
    }

    this.timeout = 300
    this.timerText = this.add.text(20, -5, this.timeout, {
      fontFamily: 'Roboto',
      fontSize: '25px',
      stroke: '#000000',
      strokeThickness: 4,
      fill: '#ffffff'
    }).setScrollFactor(0)

    this.timer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeout--
        this.timerText.setText(this.timeout)

        if (this.timeout <= 0) {
          this.timer.destroy()
          this.scene.stop('mapa')
          this.scene.start('finalTriste')
        }
      },
      callbackScope: this,
      loop: true
    })

    this.pontos = this.add.text(20, 30, 0, {
      fontFamily: 'Roboto',
      fontSize: '25px',
      stroke: '#000000',
      strokeThickness: 4,
      fill: '#ffffff'
    }).setScrollFactor(0)
  }

  update () {
    try {
      // Envia os dados do jogo somente se houver conexao aberta
      if (globalThis.game.dadosJogo.readyState === 'open') {
        // Verifica que o personagem local existe
        if (this.personagemLocal) {
          // Envia os dados do personagem local via DataChannel
          globalThis.game.dadosJogo.send(JSON.stringify({
            personagem: {
              x: this.personagemLocal.x,
              y: this.personagemLocal.y,
              frame: this.personagemLocal.frame.name
            }
          }))
        }

        // console.log('x: ', this.personagemLocal.x)
        // console.log('y: ', this.personagemLocal.y)

        // Verifica se o personagem local coletou o cartão
        if (this.cartao) {
          // Envia os dados dos cartoes via DataChannel
          globalThis.game.dadosJogo.send(JSON.stringify({
            cartao: this.cartao.map(cartao => (cartao => ({
              visible: cartao.objeto.visible
            }))(cartao))
          }))
        }

        // Atualiza o placar de cartoes coletadas pelos dois jogadores
        this.pontos.setText('Cartões: ' + this.cartao.filter(cartao => !cartao.objeto.active).length)
      }
    } catch (error) {
      // Gera mensagem de erro na console
      console.error(error)
    }

    if (this.alien) {
      // alien segue personagem mais próximo
      const hipotenusaPersonagemLocal = Phaser.Math.Distance.Between(
        this.personagemLocal.x,
        this.personagemLocal.y,
        this.alien.x,
        this.alien.y
      )

      const hipotenusaPersonagemRemoto = Phaser.Math.Distance.Between(
        this.personagemRemoto.x,
        this.personagemRemoto.y,
        this.alien.x,
        this.alien.y
      )

      // Por padrão, o primeiro jogador é o alvo
      let alvo = this.personagemLocal
      if (hipotenusaPersonagemLocal > hipotenusaPersonagemRemoto) {
        // Jogador 2 é perseguido pelo alien
        alvo = this.personagemRemoto
      }

      // Sentido no eixo X
      const diffX = alvo.x - this.alien.x
      if (diffX >= 10) {
        this.alien.setVelocityX(40)
      } else if (diffX <= 10) {
        this.alien.setVelocityX(-40)
      }

      // Sentido no eixo Y
      const diffY = alvo.y - this.alien.y
      if (diffY >= 10) {
        this.alien.setVelocityY(40)
      } else if (diffY <= 10) {
        this.alien.setVelocityY(-40)
      }

      // Animação
      try {
        if (diffX > 0) {
          this.alien.anims.play('alien-direita', true)
        } else if (diffX < 0) {
          this.alien.anims.play('alien-esquerda', true)
        } else if (diffY > 0) {
          this.alien.anims.play('alien-baixo', true)
        } else if (diffY < 0) {
          this.alien.anims.play('alien-cima', true)
        } else {
          this.alien.anims.play('alien-parado')
        }
      } catch (error) {
        console.error(error)
      }
    }

    // adiciona alien
    const cartoesColetados = this.cartao.filter(cartao => !cartao.objeto.active).length
    if (cartoesColetados === 1 && !this.alien) {
      // Identificando qual personagem coletou o cartão
      let x, y
      if (this.cartao.find(cartao => !cartao.objeto.active).coletor) {
        x = this.personagemLocal.x
        y = this.personagemLocal.y
      } else {
        x = this.personagemRemoto.x
        y = this.personagemRemoto.y
      }

      // Crie o alien perto do personagem que coletou o cartão
      this.alien = this.physics.add.sprite(x + 70, y, 'alien')
      this.physics.add.collider(this.alien, this.layerparedes)
      this.physics.add.collider(this.alien, this.layerobjetos)
      // Seguir o personagem
      this.physics.moveToObject(this.alien, this.personagemLocal, 100)
      this.physics.add.collider(this.alien, this.personagemLocal, () => {
        // globalThis.game.dadosJogo.send(JSON.stringify({ gameover: true }))
        this.scene.stop('mapa')
        this.scene.start('finalTriste')
      }, null, this)
    } else if (cartoesColetados >= 10) {
      this.scene.stop('mapa')
      this.scene.start('finalFeliz')
    }
  }
}
