layers = list[str]()

for layer in vmap.layers:
    layers.append(layer.to_json())
    
