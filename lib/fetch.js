// butter-fetch v0.0.0
// Object Storageから情報を取得して適当な形に落とし込むためのライブラリ

// グローバル関数を汚さないためにIIFE形式で定義
// ES6のmoduleだと動かないブラウザが一応あるので，埋め込み用ライブラリであることを考えて普通の機能で実現する
(function() {
    const GetDataList = async () =>{
        await waitCAReady()
        try{
            const req = await(await fetch(`${Runtime.host}/datalist.json`)).json()
            return req.data_list
        }catch{
            throw new Error("something wrong") // TODO
        }
    }
    const GetInfo = async (gtfsID)=>{
        await waitCAReady()
        try{
            const req = await(await fetch(`${Runtime.host}/${gtfsID}/info.json`)).json()
            return req
        }catch{
            throw new Error("something wrong") // TODO
        }
    }
    const GetData = async (gtfsID, versionID)=>{
        await waitCAReady()
        try{
            const req = await(await fetch(`${Runtime.host}/${gtfsID}/${versionID}/info.json`)).json()
            console.log(req)
            if(Configs.debug)console.log(`${Runtime.host}/${gtfsID}/${versionID}/info.json`)
        }catch{
            throw new Error("something wrong") // TODO
        }
    }
    const GetBusStops = async () => {

    }

    const SetCA = async(rootCA)=>{
        //末尾をスラッシュなしに統一する
        if (!rootCA.endsWith("root.json")) {
            return // TODO
        }
        Configs.rootCA = rootCA

        try{
            const req = await(await fetch(Configs.rootCA)).json()
            Runtime.CA = req

            Runtime.host = Runtime.CA.hosts[0]
            Runtime.readyFlags.ca = true
        }catch{
            throw new Error("something wrong") // TODO
        }
    }

    // エクスポートするオブジェクトを定義する
    let Configs = {
        debug: true,
    }
    let Runtime = {
        isReady: false,
        readyFlags:{
            dom:false,
            ca:false,
            deps:false,
        },
        loadedDeps:0
    }

    const ext = async (url)=>{
        await waitDepsReady()
        const response = await fetch(url);
        console.log(url)
        const gzipData = await response.arrayBuffer();
      
        // gzip形式のデータを解凍する
        const data = pako.inflate(gzipData);
      
        // tarファイルを解凍する
        const files = await untar(data);
      
        // ファイルの中身を操作する
        files.forEach((file) => {
          console.log(file.name); // ファイル名を表示する
          console.log(file.buffer); // ファイルの中身を表示する
        });
    }

    // tarファイルを解凍する関数
    async function untar(data) {
        const files = [];
        const headerSize = 512;
        let offset = 0;
    
        while (offset < data.length) {
            const header = new Uint8Array(data.slice(offset, offset + headerSize));
            const name = new TextDecoder().decode(header.subarray(0, 100)).trim();
            const size = parseInt(new TextDecoder().decode(header.subarray(124, 136)).trim(), 8);
            offset += headerSize;
        
            if (name) {
                const buffer = data.slice(offset, offset + size);
                files.push({ name, size, buffer });
            }
        
            offset += size;
            if (size % 512 !== 0) {
                offset += 512 - (size % 512);
            }
        }
    
        return files;
    }

    // webpackを使うほど仰々しくないので，独自に依存関係を解決する
    const Dependencies = [
        {
            src:"https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js",
        }
    ]
    const loadDependencies = (deps)=>{
        deps.forEach(e => {
            // DOM操作で依存関係の解決をする
            let script = document.createElement("script")
            script.src = e.src
            script.onload = ()=>{
                Runtime.loadedDeps += 1
                if(Runtime.loadedDeps == Dependencies.length){
                    Runtime.readyFlags.deps = true
                }
            }
            window.document.body.appendChild(script)
        });
    }

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const waitReady = async()=>{
        while(!Runtime.isReady){
            await sleep(100)
            if(Object.values(Runtime.readyFlags).every(e=>e)){
                Runtime.isReady = true
            }
        }
    }
    const waitDOMReady = async()=>{
        while(!Runtime.readyFlags.dom){
            await sleep(100)
        }
    }
    const waitCAReady = async()=>{
        while(!Runtime.readyFlags.ca){
            await sleep(100)
        }
    }
    const waitDepsReady = async()=>{
        while(!Runtime.readyFlags.deps){
            await sleep(100)
        }
    }
    document.addEventListener("DOMContentLoaded", function(event) { 
        Runtime.readyFlags.dom = true
    });

    // on load
    (async ()=>{
        await waitDOMReady()
        SetCA("https://butter.takoyaki3.com/v0.0.0/root.json")
        loadDependencies(Dependencies)
    })();

    // グローバルのスコープへのexport
    window.Butter = {
        GetDataList,
        GetInfo,
        GetData,
        GetBusStops,
        SetCA,
        ext,
    }
})();