const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", async function () {
    let deployer, addr1, addr2, nft, marketplace
    let feePercent = 1
    let URI = "Sample URI"
    beforeEach(async function() {   
        const NFT = await ethers.getContractFactory("NFT");
        const Marketplace = await ethers.getContractFactory("Marketplace");

        [deployer, addr1, addr2] = await ethers.getSigners();

        nft = await NFT.deploy();
        marketplace = await Marketplace.deploy(feePercent);
    });
    describe("Deployment", function () {
        it("Should track name and symbol of NFT collection", async function () {
            expect(await nft.name()).to.equal("DApp NFT")
            expect(await nft.symbol()).to.equal("DAPP")
        })
        it("Should track feeAccount and feePercent of the NFT Marketplace", async function () {
            expect(await marketplace.feeAccount()).to.equal(deployer.address)
            expect(await marketplace.feePercent()).to.equal(feePercent)
        })
    });
    describe("Minting NFTs", function () {
        it("Should track each minted NFT", async function () {
            // addr1 mints an nft
            await nft.connect(addr1).mint(URI)
            expect(await nft.tokenCount()).to.equal(1)
            expect(await nft.balanceOf(addr1.address)).to.equal(1)
            expect(await nft.tokenURI(1)).to.equal(URI);
            // addr2 mints an nft
            await nft.connect(addr2).mint(URI)
            expect(await nft.tokenCount()).to.equal(2)
            expect(await nft.balanceOf(addr1.address)).to.equal(1)
            expect(await nft.tokenURI(2)).to.equal(URI);
        })
    })
    describe("Listing Marketplace items", function () {
        beforeEach(async function () {
            // addr1 Mints NFT
            await nft.connect(addr1).mint(URI);
            // addr1 approves marketplace to spend nft
            await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
        })
        it("should  track newly created item, transfer NFT from seller to marketplace, and emit offered event", async function () {
            await expect(marketplace.connect(addr1).makeItem(nft.address, 1, toWei(1)))
            // addr1 offers their NFT at 1 ether
            .to.emit(marketplace.Offered)
            .withArgs(
                1,
                nft.address,
                1,
                toWei(1),
                addr1.address,
            )
            // owner of the NFT should now be the marketplace owner
            expect(await nft.ownerOf(1)).to.equal(marketplace.address);
            // item count should now equal 1
            expect (await marketplace.itemCount(1)).to.equal(1);
            // get item from item mapping and double check that the fields are correct
            const item = await marketplace.items(1)
            expect(item.itemId).to.equal(1)
            expect(item.nft).to.equal(nft.address)
            expect(item.tokenId).to.equal(1)
            expect(item.price).to.equal(toWei(1))
            expect(item.sold).to.equal(false)
        });
        it("Should fail if price is set tp zero", async function() {
            await expect(
                marketplace.connect(addr1).makeItem(nft.address, 1, 0)
            ).to.be.revertedWith("Price must be greater than zero");
        });
    })
})
