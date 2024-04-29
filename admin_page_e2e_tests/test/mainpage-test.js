describe('Main Page', function () {

    before(client => {
        this.home = client.page.main();
        this.navbar = this.home.section.navbar;
        this.main = this.home.section.main;
        this.ukrChannelList = this.home.section.ukrChannelList;
        this.katsapChannelList = this.home.section.katsapChannelList;
        this.westernChannelList = this.home.section.westernChannelList;
        this.modal = this.home.section.modal;
        this.backfill = this.home.section.backfill; 
        this.home.navigate();
    });

    it('MAIN: Nav Bar Logged Out', client => {
        this.navbar.expect.element('@brand').to.be.visible;
        this.navbar.expect.element('@brand').text.to.equal('Telegram Data Export');
        this.navbar.expect.element('@login').to.be.visible;
        this.navbar.expect.element('@login').text.to.equal('Sign in with Google 🚀');
    });

    it('MAIN: Not authenticated', client => {
        this.home.expect.section('@main').to.be.visible;
        this.home.expect.section('@main').text.to.equal('Not auth');
    });

    it('MAIN: Auth with invalid token', client => {
        let token = 'invalid_token';
        browser.executeScript(function (token) {
            localStorage.setItem('tokenId', `"${token}"`);
        }, [token]);
        browser.refresh();
        this.home.expect.section('@main').text.to.equal('Not auth');
    });

    it('MAIN: Auth with token - main page content is shown', client => {
        let token = process.env.GAUTH_JWT_TOKEN;
        browser.executeScript(function (token) {
            localStorage.setItem('tokenId', `"${token}"`);
        }, [token]);
        browser.refresh();
        this.home.expect.section('@main').text.not.to.equal('Not auth');
        client.pause(1000);
        this.main.expect.element('@accordion').to.be.visible;
        this.main.expect.element('@ukr').to.be.visible;
        this.main.expect.element('@ukr').text.to.equal('ukr');
        this.main.expect.element('@katsap').to.be.visible;
        this.main.expect.element('@katsap').text.to.equal('katsap');
        this.main.expect.element('@western').to.be.visible;
        this.main.expect.element('@western').text.to.equal('western');
    });

    
    it('MAIN: Nav Bar Logged In', client => {
        this.navbar.expect.element('@brand').to.be.visible;
        this.navbar.expect.element('@brand').text.to.equal('Telegram Data Export');
        this.navbar.expect.element('@home').to.be.visible;
        this.navbar.expect.element('@home').text.to.equal('Manage Channels');
        this.navbar.expect.element('@login').to.be.visible;
        this.navbar.expect.element('@login').text.to.equal('Logout');
    });

    it('Expand accordion (ukr)', client => {
        this.main.click('@ukr');
        this.ukrChannelList.expect.element('@headers').to.be.visible;
        this.ukrChannelList.expect.element('@headers').text.to.equal('TITLE LANGUAGE');
        this.ukrChannelList.expect.element('@add').to.be.visible;
        this.ukrChannelList.expect.element('@firstRow').to.be.visible;
        this.ukrChannelList.expect.element('@firstRow').text.to.equal('RomanShrike katsap');
        this.ukrChannelList.expect.element('@firstRowDelete').to.be.visible;
        this.ukrChannelList.expect.element('@firstRowEdit').to.be.visible;
    });

    it('Expand accordion (katsap)', client => {
        this.main.click('@katsap');
        this.katsapChannelList.expect.element('@headers').to.be.visible;
        this.katsapChannelList.expect.element('@headers').text.to.equal('TITLE LANGUAGE');
        this.katsapChannelList.expect.element('@add').to.be.visible;
        this.katsapChannelList.expect.element('@firstRow').to.be.visible;
        this.katsapChannelList.expect.element('@firstRow').text.to.equal('meduzalive katsap');
        this.katsapChannelList.expect.element('@firstRowDelete').to.be.visible;
        this.katsapChannelList.expect.element('@firstRowEdit').to.be.visible;
    });

    it('Expand accordion (western)', client => {
        this.main.click('@western');
        this.westernChannelList.expect.element('@headers').to.be.visible;
        this.westernChannelList.expect.element('@headers').text.to.equal('TITLE LANGUAGE');
        this.westernChannelList.expect.element('@add').to.be.visible;
        this.westernChannelList.expect.element('@firstRow').to.be.visible;
        this.westernChannelList.expect.element('@firstRow').text.to.equal('WeTheMedia en');
        this.westernChannelList.expect.element('@firstRowDelete').to.be.visible;
        this.westernChannelList.expect.element('@firstRowEdit').to.be.visible;
    });

    it('MAIN: Add new channel', client => {
        let newChannel = {
            title: 'new_channel',
            language: 'ukr'
        };
        this.main.click('@ukrButton');
        this.ukrChannelList.click('@add');
        this.modal.expect.element('@header').to.be.visible;
        this.modal.expect.element('@header').text.to.equal('Create channel');
        this.modal.click('@closeBtn');
        this.modal.expect.element('@header').not.to.be.present;
    });

    it('MAIN: Edit channel', client => {
        let newChannel = {
            title: 'new_channel',
            language: 'ukr'
        };
        this.main.click('@ukrButton');
        this.ukrChannelList.click('@firstRowEdit');
        this.modal.expect.element('@header').to.be.visible;
        this.modal.expect.element('@header').text.to.equal('Update channel');
        this.modal.click('@closeBtn');
        this.modal.expect.element('@header').not.to.be.present;
    });

    it('MAIN: Navigate to backfill page', client => {
        browser.refresh();
        this.navbar.click('@backfill');
        this.home.expect.section('@main').text.to.contain('Create backfill');
    });


    it('MAIN: Sign out', client => {
        this.navbar.click('@login');
        this.navbar.expect.element('@login').text.to.equal('Sign in with Google 🚀');
        this.home.expect.section('@main').text.to.equal('Not auth');
    });

    after(client => client.end());

});