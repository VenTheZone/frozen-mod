# Frozen (Java Edition, Fabric 1.20.1)

The original Java Edition version of the mod. It needs Fabric Loader and Fabric API `0.92.x+1.20.1`, and builds with Java 17.

```bash
./gradlew build            # jar in build/libs/
./gradlew runGametest      # headless in-game tests
```

Regenerate the textures with `python3 tools/gen_textures.py`. In game, `/locate structure frozen:ice_castle` and `/locate structure frozen:arendelle` find the structures.
